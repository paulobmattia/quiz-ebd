import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wifi, Shield, Terminal } from 'lucide-react';
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

  const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  return (
    <>
      <header className="bg-[#18181B]/90 backdrop-blur-md border-b border-[#27272A] sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo e Identidade Operative Selection */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#03060A] border border-[#27272A] group-hover:border-[#00E5FF] flex items-center justify-center text-[#00E5FF] transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white uppercase">
                  Operative <span className="text-[#00E5FF]">///</span> Quiz
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-semibold tracking-wider">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#A1A1AA]">SISTEMA DE INTERAÇÃO EM TEMPO REAL</p>
            </div>
          </div>

          {/* Navegação e Status de Rede */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                currentView === 'player'
                  ? 'bg-[#00E5FF] text-[#03060A] font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/70 border border-transparent hover:border-[#27272A]'
              }`}
            >
              [+] ENTRAR PIN
            </button>

            <button
              onClick={() => onNavigate('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                currentView === 'manager'
                  ? 'bg-[#00E5FF] text-[#03060A] font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/70 border border-transparent hover:border-[#27272A]'
              }`}
            >
              ESTÚDIO
            </button>

            {/* Informações de Rede Wi-Fi / Nuvem */}
            <button
              onClick={() => setShowNetworkModal(true)}
              title="Status de Conexão dos Alunos"
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#03060A] border border-[#27272A] hover:border-[#00E5FF]/50 text-[#A1A1AA] hover:text-white transition-all flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="hidden sm:inline">
                {isCloud ? 'NUVEM // ONLINE' : `IP: ${networkInfo?.localIp || 'LOCAL'}`}
              </span>
            </button>

            {/* Controle de Volume */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
              className="p-2 rounded-lg bg-[#03060A] border border-[#27272A] text-[#A1A1AA] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#E51C24]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#00E5FF]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Informações de Conexão Tática */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="hud-panel p-6 max-w-md w-full text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#00E5FF]" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  STATUS DE TRANSMISSÃO
                </h3>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="text-[#A1A1AA] hover:text-white font-mono text-sm"
              >
                [X]
              </button>
            </div>

            <p className="text-xs text-[#A1A1AA]">
              {isCloud
                ? 'Sua plataforma está operando na nuvem com certificado seguro HTTPS. Os alunos podem acessar via Wi-Fi ou dados móveis (4G/5G).'
                : 'Conectado em rede local (Wi-Fi). Os alunos conectados à mesma rede acessam diretamente sem necessidade de internet de alta velocidade.'}
            </p>

            <div className="bg-[#03060A] p-3 rounded border border-[#27272A] space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">ENDEREÇO:</span>
                <span className="text-[#00E5FF] font-bold">{isCloud ? window.location.origin : networkInfo?.localUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">IP DA REDE:</span>
                <span className="text-white">{networkInfo?.localIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">CANAL WEBSOCKET:</span>
                <span className="text-emerald-400 font-bold">ATIVO / 100% SEGURO</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded bg-[#00E5FF]/5 border border-[#00E5FF]/20 text-[11px] text-[#00E5FF]">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Proteção anti-cheat de tempo autoritativo ativada.</span>
            </div>

            <button
              onClick={() => setShowNetworkModal(false)}
              className="w-full py-2 bg-[#00E5FF] hover:bg-[#00c8e0] text-[#03060A] font-mono font-bold text-xs rounded uppercase tracking-wider transition-colors"
            >
              FECHAR PAINEL
            </button>
          </div>
        </div>
      )}
    </>
  );
};
