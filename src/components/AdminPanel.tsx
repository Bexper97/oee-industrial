import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Users, Box, BarChart3, ChevronLeft } from 'lucide-react';

interface AdminPanelProps {
    onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'operadores' | 'maquinas' | 'relatorios'>('relatorios');
    const [items, setItems] = useState<any[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const fetchItems = async () => {
        setLoading(true);
        const table = activeTab === 'operadores' ? 'operadores' : activeTab === 'maquinas' ? 'maquinas' : null;
        if (!table) {
            setLoading(false);
            return;
        }

        const { data } = await supabase.from(table).select('*').order('nome');
        if (data) setItems(data);
        setLoading(false);
    };

    const handleAddItem = async () => {
        if (!newItemName) return;
        const table = activeTab === 'operadores' ? 'operadores' : 'maquinas';

        const { error } = await supabase.from(table).insert([{ nome: newItemName }]);
        if (!error) {
            setNewItemName('');
            fetchItems();
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const table = activeTab === 'operadores' ? 'operadores' : 'maquinas';
        const field = activeTab === 'operadores' ? 'ativo' : 'ativa';

        await supabase.from(table).update({ [field]: !currentStatus }).eq('id', id);
        fetchItems();
    };

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
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={`Novo ${activeTab === 'operadores' ? 'operador' : 'máquina'}...`}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="flex-1 bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 outline-none"
                        />
                        <button
                            onClick={handleAddItem}
                            className="bg-brand-green text-white p-3 rounded-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <p className="text-gray-500 text-center py-4 italic">Carregando...</p>
                        ) : items.map(item => (
                            <div key={item.id} className="bg-glass p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                <span className={item.ativo === false || item.ativa === false ? 'text-gray-600 line-through' : 'text-white font-medium'}>
                                    {item.nome}
                                </span>
                                <button
                                    onClick={() => handleToggleActive(item.id, item.ativo ?? item.ativa)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${item.ativo === false || item.ativa === false ? 'bg-gray-700 text-gray-400' : 'bg-brand-green/20 text-brand-green'}`}
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
