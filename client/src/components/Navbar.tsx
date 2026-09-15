import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wifi } from 'lucide-react';
import { soundManager } from '../utils/audio.js';
import type { NetworkInfo } from '../types.js';

interface NavbarProps {
  currentView: 'home' | 'manager' | 'host' | 'player';
  onNavigate: (view: 'home' | 'manager' | 'player') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  useEffect(() => {
    fetch('/api/network')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch(() => {
        setNetworkInfo({
          localIp: window.location.hostname,
          port: 3001,
          clientPort: 5173,
          localUrl: window.location.origin,
          devClientUrl: window.location.origin,
        });
      });
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playClick();
    }
  };

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo e Título */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              ✨
            </div>
            <div className="text-left">
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                QuizEBD <span className="text-xs bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">AO VIVO</span>
              </span>
              <p className="text-xs text-slate-400">Interatividade & Dinâmica</p>
            </div>
          </div>

          {/* Navegação e Ferramentas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('player')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'player'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              📱 Entrar com PIN
            </button>

            <button
              onClick={() => onNavigate('manager')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'manager'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              📝 Criar & Editar Quizzes
            </button>

            {/* Informações de Rede Wi-Fi */}
            <button
              onClick={() => setShowNetworkModal(true)}
              title="Ver endereço Wi-Fi para os alunos conectarem"
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
            >
              <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline font-mono">{networkInfo?.localIp || 'Wi-Fi'}</span>
            </button>

            {/* Controle de Volume */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Informações de Conexão Wi-Fi */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-400" /> Conexão na Mesma Sala / Wi-Fi
              </h3>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Para os alunos responderem pelo celular sem precisar de internet externa:
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mb-4 font-mono text-xs">
              <div>
                <span className="text-slate-400">IP na Rede Local: </span>
                <span className="text-emerald-400 font-bold">{networkInfo?.localIp}</span>
              </div>
              <div>
                <span className="text-slate-400">Link Direto: </span>
                <span className="text-indigo-400 underline">{networkInfo?.localUrl}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              💡 <strong>Dica:</strong> Quando você iniciar a apresentação no telão, o sistema gera automaticamente um <strong>QR Code gigante</strong> na tela para os alunos apenas apontarem a câmera do celular e entrarem direto!
            </p>
            <button
              onClick={() => setShowNetworkModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
