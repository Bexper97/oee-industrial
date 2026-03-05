import { useState, useEffect } from 'react'
import SelectionScreen from './components/SelectionScreen'
import OperatorDashboard from './components/OperatorDashboard'
import AdminPanel from './components/AdminPanel'
import SyncIndicator from './components/SyncIndicator'
import type { Operador, Maquina } from './types'
import { LogOut, LayoutDashboard, Settings } from 'lucide-react'

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [session, setSession] = useState<{
    operador: Operador;
    maquina: Maquina;
    turno: '1' | '2';
  } | null>(null);

  // Recupera sessão salva localmente se houver (para não perder no refresh)
  useEffect(() => {
    const saved = localStorage.getItem('oee_session');
    if (saved) {
      setSession(JSON.parse(saved));
    }
  }, []);

  const handleSelectionComplete = (selection: { operador: Operador; maquina: Maquina; turno: '1' | '2' }) => {
    setSession(selection);
    localStorage.setItem('oee_session', JSON.stringify(selection));
  };

  const logout = () => {
    if (window.confirm('Deseja realmente encerrar a sessão deste turno?')) {
      localStorage.removeItem('oee_session');
      setSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center">
      {/* Header Fixo */}
      <header className="w-full p-4 flex justify-between items-center bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-brand-green" />
            <span className="font-bold text-lg text-white">FlowOEE</span>
          </div>
          <SyncIndicator />
        </div>

        <div className="flex items-center gap-2">
          {!session && !isAdminMode && (
            <button
              onClick={() => setIsAdminMode(true)}
              className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white"
            >
              <Settings size={20} />
            </button>
          )}

          {session && (
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-lg flex-1 flex flex-col p-4 mx-auto">
        {isAdminMode ? (
          <AdminPanel onBack={() => setIsAdminMode(false)} />
        ) : !session ? (
          <SelectionScreen onSelectionComplete={handleSelectionComplete} />
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Info do Operador */}
            <div className="bg-glass p-4 rounded-2xl border border-white/5">
              <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">OPERADOR ATIVO</p>
              <h2 className="text-xl font-bold text-white">{session.operador.nome}</h2>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-brand-green/20 text-brand-green px-2 py-1 rounded-md border border-brand-green/30 font-bold uppercase">
                  {session.maquina.nome}
                </span>
                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded-md border border-white/10 font-bold uppercase">
                  Turno {session.turno}
                </span>
              </div>
            </div>

            {/* Dashboard de Operação */}
            <OperatorDashboard session={session} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
