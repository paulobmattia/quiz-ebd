import React, { useState } from 'react';
import { Play, PlusCircle, Smartphone, Zap, Users, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Banner */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Quizzes ao Vivo com o Celular
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          A dinâmica de quiz perfeita para sua{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            EBD ou Sala de Aula
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Tudo o que você ama no <strong>Mentimeter</strong> e <strong>Kahoot</strong>: perguntas interativas no telão, respostas em tempo real no celular, placar ao vivo e bônus de velocidade — sem limitações e 100% gratuito.
        </p>
      </div>

      {/* Cards de Ação Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Entrar com PIN (Aluno) */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Entrar em um Quiz</h2>
              <p className="text-sm text-slate-400">
                Está na aula ou evento? Digite o PIN de 6 dígitos que aparece no telão do professor.
              </p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="mt-6 space-y-3">
            <input
              type="text"
              maxLength={6}
              placeholder="Ex: 849201"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              Participar Agora
            </button>
          </form>
        </div>

        {/* Card 2: Apresentar no Telão (Professor - Início Imediato) */}
        <div className="bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-800/40 hover:border-purple-500/60 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-purple-400" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-1">
                RECOMENDADO
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Apresentar Quiz Rápido</h2>
              <p className="text-sm text-slate-400">
                Inicie instantaneamente o <strong>"Super Quiz Bíblico - Heróis da Fé"</strong> pré-configurado no telão com QR Code!
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                soundManager.playClick();
                onQuickStart();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Abrir no Telão / Projetor
            </button>
          </div>
        </div>

        {/* Card 3: Criar / Gerenciar Quizzes */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-pink-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Criador de Quizzes</h2>
              <p className="text-sm text-slate-400">
                Monte suas próprias perguntas, defina alternativas, tempo de resposta, explicações bíblicas e modos de jogo.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenManager();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              Gerenciar Quizzes
            </button>
          </div>
        </div>
      </div>

      {/* Vantagens / Diferenciais */}
      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-center text-lg font-bold text-white mb-8">
          Por que esta plataforma supera as limitações das ferramentas pagas?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <InfinityIcon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Sem Limite de Questões</h4>
            <p className="text-xs text-slate-400">
              O Mentimeter limita a 2-3 perguntas no plano grátis. Aqui você cria 10, 30 ou 100 perguntas à vontade.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Público Ilimitado</h4>
            <p className="text-xs text-slate-400">
              Conecte 10, 50 ou centenas de participantes simultâneos na mesma sala sem custos adicionais.
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Bônus por Velocidade</h4>
            <p className="text-xs text-slate-400">
              Cálculo milimétrico: quem responde mais rápido ganha mais pontos, aumentando a adrenalina da turma!
            </p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Funciona no Wi-Fi Local</h4>
            <p className="text-xs text-slate-400">
              Pode ser executado diretamente no notebook do professor via Wi-Fi, sem depender de internet de alta velocidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
