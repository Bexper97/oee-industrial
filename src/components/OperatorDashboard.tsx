import React, { useState, useEffect } from 'react';
import type { Operador, Maquina } from '../types';
import { Play, Square, AlertCircle, Save, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

interface OperatorDashboardProps {
    session: {
        operador: Operador;
        maquina: Maquina;
        turno: '1' | '2';
    };
}

const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ session }) => {
    const [isStopped, setIsStopped] = useState(false);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);

    // Downtime form fields
    const [tipoParada, setTipoParada] = useState('Operacional');
    const [utilidade, setUtilidade] = useState('');
    const [descricao, setDescricao] = useState('');
    const [nota, setNota] = useState('');
    const [producaoQty, setProducaoQty] = useState('');

    // Timer effect
    useEffect(() => {
        let interval: any;
        if (isStopped && startTime) {
            interval = setInterval(() => {
                const diff = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);
                setElapsed(diff);
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [isStopped, startTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = () => {
        const now = new Date().toISOString();
        setStartTime(now);
        setIsStopped(true);
    };

    const handleResume = async () => {
        const endTime = new Date().toISOString();

        const registro = {
            operador_id: session.operador.id,
            maquina_id: session.maquina.id,
            turno: session.turno,
            tipo_parada: tipoParada,
            utilidades_foco: utilidade,
            descricao,
            numero_nota: nota,
            inicio_parada: startTime!,
            fim_parada: endTime
        };

        // 1. Tenta salvar no Supabase (Online)
        try {
            const { error } = await supabase.from('paradas').insert([registro]);
            if (error) throw error;
            console.log('Sincronizado com sucesso!');
        } catch (err) {
            // 2. Se falhar, salva no IndexedDB (Offline)
            console.warn('Offline: Salvando localmente...');
            await db.records.add({
                type: 'parada',
                data: registro,
                synced: 0,
                timestamp: new Date().toISOString()
            });
        }

        // Reset state
        setIsStopped(false);
        setStartTime(null);
        setDescricao('');
        setNota('');
        setUtilidade('');
    };

    const handleSaveProducao = async () => {
        const qty = parseInt(producaoQty);
        if (isNaN(qty) || qty <= 0) return;

        const registro = {
            operador_id: session.operador.id,
            maquina_id: session.maquina.id,
            turno: session.turno,
            data_referencia: new Date().toISOString().split('T')[0],
            hora_referencia: new Date().getHours(),
            quantidade: qty
        };

        try {
            const { error } = await supabase.from('producao_hora').insert([registro]);
            if (error) throw error;
            alert('Produção lançada com sucesso!');
            setProducaoQty('');
        } catch (err) {
            console.warn('Offline: Salvando produção localmente...');
            await db.records.add({
                type: 'producao',
                data: registro,
                synced: 0,
                timestamp: new Date().toISOString()
            });
            alert('Lançamento salvo offline!');
            setProducaoQty('');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Status Card */}
            <motion.div
                animate={{
                    backgroundColor: isStopped ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    borderColor: isStopped ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'
                }}
                className="p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center gap-4 transition-colors"
            >
                <div className={`p-4 rounded-full ${isStopped ? 'bg-brand-red' : 'bg-brand-green'} animate-pulse`}>
                    {isStopped ? <Square size={32} className="text-white" fill="white" /> : <Play size={32} className="text-white" fill="white" />}
                </div>

                <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-wider">
                        {isStopped ? 'MÁQUINA PARADA' : 'EM OPERAÇÃO'}
                    </h3>
                    {isStopped && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-brand-red font-mono text-xl">
                            <Clock size={20} />
                            {formatTime(elapsed)}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                {!isStopped ? (
                    <button
                        onClick={handleStop}
                        className="w-full btn-status-idle p-6 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-xl uppercase"
                    >
                        <AlertCircle size={24} /> REGISTRAR PARADA
                    </button>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Downtime Justification Form */}
                        <div className="bg-glass p-6 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
                            <h4 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-2">
                                <AlertCircle size={18} className="text-brand-red" /> MOTIVO DA PARADA
                            </h4>

                            <div className="grid grid-cols-2 gap-2">
                                {['Operacional', 'Manutenção', 'Frio', 'Utilidades'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTipoParada(t)}
                                        className={`p-3 rounded-lg border text-sm transition-all ${tipoParada === t ? 'bg-white text-brand-dark border-white font-bold' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {tipoParada === 'Utilidades' && (
                                <select
                                    value={utilidade}
                                    onChange={(e) => setUtilidade(e.target.value)}
                                    className="bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 outline-none"
                                >
                                    <option value="">Qual Utilidade?</option>
                                    <option value="Água">Água</option>
                                    <option value="Vapor">Vapor</option>
                                    <option value="Energia">Energia Elétrica</option>
                                </select>
                            )}

                            <input
                                type="text"
                                placeholder="Descrição da parada (opcional)"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                className="bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 outline-none focus:border-white/30"
                            />

                            <input
                                type="text"
                                placeholder="Número da Nota de Manutenção"
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                className="bg-brand-dark/50 text-white p-3 rounded-lg border border-white/10 outline-none focus:border-white/30"
                            />

                            <button
                                onClick={handleResume}
                                className="w-full btn-status-active p-6 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-xl uppercase mt-4"
                            >
                                <Save size={24} /> RETOMAR OPERAÇÃO
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controle de Produção */}
            <div className="bg-glass p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                <h4 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-2 uppercase tracking-widest text-[10px]">
                    <Clock size={16} className="text-brand-green" /> PRODUÇÃO HORA A HORA
                </h4>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 flex flex-col gap-2">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Quantidade Produzida</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={producaoQty}
                            onChange={(e) => setProducaoQty(e.target.value)}
                            className="bg-brand-dark/50 text-white p-4 rounded-xl border border-white/10 outline-none focus:border-brand-green text-2xl font-bold w-full"
                        />
                    </div>
                    <button
                        onClick={handleSaveProducao}
                        disabled={!producaoQty || parseInt(producaoQty) <= 0}
                        className={`p-4 h-[64px] rounded-xl font-bold transition-all flex items-center justify-center min-w-[100px] ${(!producaoQty || parseInt(producaoQty) <= 0) ? 'bg-gray-700 text-gray-500' : 'bg-brand-green text-white shadow-lg shadow-brand-green/20'}`}
                    >
                        LANÇAR
                    </button>
                </div>

                <p className="text-[9px] text-gray-500 italic text-center">
                    O sistema registrará automaticamente a hora atual ({new Date().getHours()}h)
                </p>
            </div>
        </div>
    );
};

export default OperatorDashboard;
