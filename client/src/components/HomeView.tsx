import React, { useState } from 'react';
import { Play, PlusCircle, Smartphone, Zap, Users, Infinity as InfinityIcon, ShieldCheck, Crosshair } from 'lucide-react';
import { soundManager } from '../utils/audio.js';

interface HomeViewProps {
  onJoinWithPin: (pin: string) => void;
  onOpenManager: () => void;
  onQuickStart: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onJoinWithPin,
  onOpenManager,
  onQuickStart,
}) => {
  const [pinInput, setPinInput] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    if (pinInput.trim()) {
      onJoinWithPin(pinInput.trim());
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] cyber-grid radial-ambient flex flex-col justify-between py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Header Tático Operative Selection */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-[#00E5FF] font-mono text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            OPERATIVE /// SECTOR EBD -- QUIZ SYSTEM
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
            DINÂMICA DE QUIZ <br />
            <span className="text-[#00E5FF] drop-shadow-[0_0_25px_rgba(0,229,255,0.3)]">
              EM TEMPO REAL
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#A1A1AA] max-w-2xl mx-auto font-sans leading-relaxed">
            Plataforma de alta precisão inspirada no Mentimeter e Kahoot. Interação ao vivo no telão, respostas no smartphone, bônus de velocidade e <strong className="text-white">zero restrições</strong>.
          </p>
        </div>

        {/* Grade de Ações Principais (Cards Táticos de 8px radius) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Entrar com PIN (Participante) */}
          <div className="hud-panel p-6 flex flex-col justify-between hover:border-[#00E5FF]/60 transition-all duration-300 group relative">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#03060A] border border-[#27272A] group-hover:border-[#00E5FF] flex items-center justify-center text-[#00E5FF] transition-all">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider block mb-1">
                  /// 01 -- PARTICIPANTE
                </span>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Entrar em um Quiz</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Digite o PIN de 6 dígitos projetado no telão para conectar seu dispositivo.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="mt-6 space-y-3">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest font-mono text-2xl py-2.5 px-4 rounded-lg bg-[#03060A] border border-[#27272A] text-[#00E5FF] placeholder-[#27272A] focus:outline-none focus:border-[#00E5FF] transition-all"
              />
              <button
                type="submit"
                disabled={!pinInput.trim()}
                className="w-full py-3 px-4 rounded-lg bg-[#00E5FF] hover:bg-[#00c8e0] disabled:opacity-30 disabled:cursor-not-allowed text-[#03060A] font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all"
              >
                CONECTAR AO QUIZ
              </button>
            </form>
          </div>

          {/* Card 2: Apresentar no Telão (Início Rápido) */}
          <div className="hud-panel p-6 flex flex-col justify-between border-[#E51C24]/40 hover:border-[#E51C24] transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-[#E51C24]/10 border-b border-l border-[#E51C24]/30 text-[#E51C24] font-mono text-[10px] font-bold uppercase tracking-wider">
              PRONTO PARA USO
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#03060A] border border-[#27272A] group-hover:border-[#E51C24] flex items-center justify-center text-[#E51C24] transition-all">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#E51C24] uppercase tracking-wider block mb-1">
                  /// 02 -- APRESENTADOR
                </span>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Iniciar no Telão</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Abra imediatamente o <strong>"Super Quiz Bíblico - Heróis da Fé"</strong> com QR Code gigante para a turma.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onQuickStart();
                }}
                className="w-full py-3 px-4 rounded-lg bg-[#E51C24] hover:bg-[#c9141b] text-white font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(229,28,36,0.3)] flex items-center justify-center gap-2 transition-all"
              >
                <Crosshair className="w-4 h-4" /> ABRIR NO TELÃO
              </button>
            </div>
          </div>

          {/* Card 3: Criador e Editor */}
          <div className="hud-panel p-6 flex flex-col justify-between hover:border-[#27272A] hover:bg-[#1c1c20] transition-all duration-300 group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#03060A] border border-[#27272A] group-hover:border-white/40 flex items-center justify-center text-white transition-all">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
                  /// 03 -- GERENCIADOR
                </span>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Estúdio de Quizzes</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Crie questionários personalizados, defina tempos, modos de jogo e use o banco de questões.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenManager();
                }}
                className="w-full py-3 px-4 rounded-lg bg-[#03060A] hover:bg-[#27272A] border border-[#27272A] text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
              >
                EDITAR E CRIAR
              </button>
            </div>
          </div>
        </div>

        {/* Comparativo Tático */}
        <div className="pt-6 border-t border-[#27272A]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-[#18181B]/50 border border-[#27272A] space-y-1">
              <div className="flex items-center gap-1.5 text-[#00E5FF] text-xs font-mono font-bold uppercase">
                <InfinityIcon className="w-3.5 h-3.5" /> QUESTÕES ILIMITADAS
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Crie quantas perguntas desejar sem limites de plano pago.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#18181B]/50 border border-[#27272A] space-y-1">
              <div className="flex items-center gap-1.5 text-[#00E5FF] text-xs font-mono font-bold uppercase">
                <Users className="w-3.5 h-3.5" /> PARTICIPANTES LIVRES
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Conecte salas inteiras e eventos sem custo por usuário.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#18181B]/50 border border-[#27272A] space-y-1">
              <div className="flex items-center gap-1.5 text-[#E51C24] text-xs font-mono font-bold uppercase">
                <Zap className="w-3.5 h-3.5" /> VELOCIDADE TÁTICA
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Algoritmo de pontuação precisa proporcional ao tempo restante.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#18181B]/50 border border-[#27272A] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> MODOS DE JOGO
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Suporte a Bônus por Velocidade, Tradicional e Eliminatório.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
