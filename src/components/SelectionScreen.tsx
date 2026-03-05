import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Operador, Maquina } from '../types';
import { User, Activity, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SelectionScreenProps {
    onSelectionComplete: (selection: { operador: Operador; maquina: Maquina; turno: '1' | '2' }) => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelectionComplete }) => {
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [selectedOperador, setSelectedOperador] = useState<string>('');
    const [selectedMaquina, setSelectedMaquina] = useState<string>('');
    const [selectedTurno, setSelectedTurno] = useState<'1' | '2'>('1');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // 1. Carrega do cache local imediatamente (offline-first)
            const cachedOps = localStorage.getItem('oee_cache_operadores');
            const cachedMacs = localStorage.getItem('oee_cache_maquinas');
            if (cachedOps) setOperadores(JSON.parse(cachedOps));
            if (cachedMacs) setMaquinas(JSON.parse(cachedMacs));

            // 2. Se estiver online, atualiza do Supabase e salva o cache
            if (navigator.onLine) {
                try {
                    const { data: ops } = await supabase.from('operadores').select('*').eq('ativo', true).order('nome');
                    const { data: macs } = await supabase.from('maquinas').select('*').eq('ativa', true).order('nome');

                    if (ops) {
                        setOperadores(ops);
                        localStorage.setItem('oee_cache_operadores', JSON.stringify(ops));
                    }
                    if (macs) {
                        setMaquinas(macs);
                        localStorage.setItem('oee_cache_maquinas', JSON.stringify(macs));
                    }
                } catch (error) {
                    console.error('Erro ao buscar dados online, usando cache:', error);
                }
            }

            setLoading(false);
        }
        fetchData();
    }, []);

    const handleStart = () => {
        const op = operadores.find(o => o.id === selectedOperador);
        const mac = maquinas.find(m => m.id === selectedMaquina);

        if (op && mac) {
            onSelectionComplete({ operador: op, maquina: mac, turno: selectedTurno });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 max-w-md mx-auto w-full"
        >
            <h1 className="text-2xl font-bold mb-6 text-white text-center">Início de Turno</h1>

            <div className="space-y-6">
                {/* Operador */}
                <div className="bg-glass p-4 rounded-xl flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <User size={16} /> Quem está operando?
                    </label>
                    <select
                        value={selectedOperador}
                        onChange={(e) => setSelectedOperador(e.target.value)}
                        className="bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 focus:border-brand-green outline-none"
                    >
                        <option value="">Selecione o Operador</option>
                        {operadores.map(op => (
                            <option key={op.id} value={op.id}>{op.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Máquina */}
                <div className="bg-glass p-4 rounded-xl flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Activity size={16} /> Qual a máquina?
                    </label>
                    <select
                        value={selectedMaquina}
                        onChange={(e) => setSelectedMaquina(e.target.value)}
                        className="bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 focus:border-brand-green outline-none"
                    >
                        <option value="">Selecione a Máquina</option>
                        {maquinas.map(mac => (
                            <option key={mac.id} value={mac.id}>{mac.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Turno */}
                <div className="bg-glass p-4 rounded-xl flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Clock size={16} /> Qual o turno?
                    </label>
                    <div className="flex gap-4 mt-1">
                        <button
                            onClick={() => setSelectedTurno('1')}
                            className={`flex-1 p-3 rounded-lg border transition-all ${selectedTurno === '1' ? 'bg-brand-green border-brand-green text-white font-bold' : 'bg-transparent border-white/10 text-gray-400'}`}
                        >
                            Turno 1
                        </button>
                        <button
                            onClick={() => setSelectedTurno('2')}
                            className={`flex-1 p-3 rounded-lg border transition-all ${selectedTurno === '2' ? 'bg-brand-green border-brand-green text-white font-bold' : 'bg-transparent border-white/10 text-gray-400'}`}
                        >
                            Turno 2
                        </button>
                    </div>
                </div>

                {/* Botão de Iniciar */}
                <button
                    disabled={!selectedOperador || !selectedMaquina}
                    onClick={handleStart}
                    className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${(!selectedOperador || !selectedMaquina) ? 'bg-gray-700 text-gray-500' : 'bg-brand-green text-white hover:brightness-110 shadow-lg'}`}
                >
                    Iniciar Operação <ArrowRight size={20} />
                </button>
            </div>
        </motion.div>
    );
};

export default SelectionScreen;
