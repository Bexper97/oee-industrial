import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Box, BarChart3, ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react';

interface AdminPanelProps {
    onBack: () => void;
}

const ADMIN_PIN = '1234'; // Altere para a senha que quiser

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const [activeTab, setActiveTab] = useState<'operadores' | 'maquinas' | 'relatorios'>('relatorios');
    const [items, setItems] = useState<any[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePinSubmit = () => {
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
            setPinError(false);
        } else {
            setPinError(true);
            setPin('');
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchItems();
    }, [activeTab, isAuthenticated]);

    const fetchItems = async () => {
        const table = activeTab === 'operadores' ? 'operadores' : activeTab === 'maquinas' ? 'maquinas' : null;
        if (!table) return;

        setLoading(true);

        // 1. Carrega cache offline imediatamente
        const cacheKey = `oee_cache_${table}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) setItems(JSON.parse(cached));

        // 2. Se online, atualiza do Supabase
        if (navigator.onLine) {
            try {
                const { data } = await supabase.from(table).select('*').order('nome');
                if (data) {
                    setItems(data);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (err) {
                console.error('Erro ao buscar dados, usando cache:', err);
            }
        }

        setLoading(false);
    };

    const handleAddItem = async () => {
        if (!newItemName.trim() || !navigator.onLine) {
            if (!navigator.onLine) alert('Sem conexão. Adicione itens quando estiver com internet.');
            return;
        }
        const table = activeTab === 'operadores' ? 'operadores' : 'maquinas';
        const { error } = await supabase.from(table).insert([{ nome: newItemName.trim() }]);
        if (!error) {
            setNewItemName('');
            fetchItems();
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        if (!navigator.onLine) { alert('Sem conexão. Edite quando estiver com internet.'); return; }
        const table = activeTab === 'operadores' ? 'operadores' : 'maquinas';
        const field = activeTab === 'operadores' ? 'ativo' : 'ativa';
        await supabase.from(table).update({ [field]: !currentStatus }).eq('id', id);
        fetchItems();
    };

    // Tela de autenticação
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-in fade-in duration-300">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                    <Lock size={36} className="text-brand-green" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
                    <p className="text-gray-500 text-sm mt-1">Digite a senha do administrador</p>
                </div>

                <div className="w-full max-w-xs flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type={showPin ? 'text' : 'password'}
                            placeholder="Senha do Admin"
                            value={pin}
                            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                            className={`w-full bg-brand-dark/50 text-white text-center text-2xl tracking-widest p-4 rounded-xl border outline-none transition-all ${pinError ? 'border-red-500 animate-pulse' : 'border-white/10 focus:border-brand-green'}`}
                            autoFocus
                        />
                        <button
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {pinError && (
                        <p className="text-red-400 text-center text-sm font-bold">Senha incorreta. Tente novamente.</p>
                    )}

                    <button
                        onClick={handlePinSubmit}
                        className="w-full bg-brand-green text-white font-bold py-4 rounded-xl text-lg hover:brightness-110 transition-all"
                    >
                        Entrar
                    </button>
                    <button
                        onClick={onBack}
                        className="text-gray-500 text-sm text-center"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white/5 rounded-lg text-gray-400">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-white">Painel Administrativo</h2>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('relatorios')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'relatorios' ? 'bg-brand-green text-white' : 'text-gray-400'}`}
                >
                    <BarChart3 size={16} /> Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('operadores')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'operadores' ? 'bg-brand-green text-white' : 'text-gray-400'}`}
                >
                    <Users size={16} /> Operadores
                </button>
                <button
                    onClick={() => setActiveTab('maquinas')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'maquinas' ? 'bg-brand-green text-white' : 'text-gray-400'}`}
                >
                    <Box size={16} /> Máquinas
                </button>
            </div>

            {activeTab === 'relatorios' ? (
                <div className="bg-glass p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4 border border-white/5">
                    <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center">
                        <BarChart3 size={32} className="text-brand-green" />
                    </div>
                    <p className="text-gray-400">Relatórios de OEE e Produtividade estarão disponíveis aqui após os primeiros registros.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {!navigator.onLine && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-400 text-xs font-bold text-center uppercase tracking-wide">
                            ⚠️ Modo Offline — Apenas leitura disponível
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={`Novo ${activeTab === 'operadores' ? 'operador' : 'máquina'}...`}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            className="flex-1 bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 outline-none focus:border-brand-green"
                        />
                        <button
                            onClick={handleAddItem}
                            disabled={!navigator.onLine}
                            className={`p-3 rounded-lg transition-all ${navigator.onLine ? 'bg-brand-green text-white' : 'bg-gray-700 text-gray-500'}`}
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {loading && !items.length ? (
                            <p className="text-gray-500 text-center py-4 italic">Carregando...</p>
                        ) : items.map(item => (
                            <div key={item.id} className="bg-glass p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                <span className={item.ativo === false || item.ativa === false ? 'text-gray-600 line-through' : 'text-white font-medium'}>
                                    {item.nome}
                                </span>
                                <button
                                    onClick={() => handleToggleActive(item.id, item.ativo ?? item.ativa)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${item.ativo === false || item.ativa === false ? 'bg-gray-700 text-gray-400' : 'bg-brand-green/20 text-brand-green border border-brand-green/30'}`}
                                >
                                    {item.ativo === false || item.ativa === false ? 'Inativo' : 'Ativo'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
