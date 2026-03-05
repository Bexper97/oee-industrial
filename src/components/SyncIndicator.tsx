import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Wifi } from 'lucide-react';

const SyncIndicator: React.FC = () => {
    const pendingRecords = useLiveQuery(() => db.records.where('synced').equals(0).toArray());
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncData = async () => {
        if (!isOnline || isSyncing || !pendingRecords?.length) return;

        setIsSyncing(true);
        try {
            for (const record of pendingRecords) {
                const table = record.type === 'parada' ? 'paradas' : 'producao_hora';
                const { error } = await supabase.from(table).insert([record.data]);

                if (!error) {
                    await db.records.update(record.id!, { synced: 1 });
                }
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync when online
    useEffect(() => {
        if (isOnline && pendingRecords?.length) {
            syncData();
        }
    }, [isOnline, pendingRecords]);

    if (!pendingRecords?.length) return (
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
            <Wifi size={12} className="text-brand-green" /> Sincronizado
        </div>
    );

    return (
        <button
            onClick={syncData}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${isOnline ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' : 'bg-gray-800 text-gray-500 border border-white/5'}`}
        >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {pendingRecords.length} Pendentes {!isOnline && '(Sem Internet)'}
        </button>
    );
};

export default SyncIndicator;
