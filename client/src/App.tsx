import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { HomeView } from './components/HomeView.js';
import { QuizManager } from './components/QuizManager.js';
import { HostView } from './components/HostView.js';
import { PlayerView } from './components/PlayerView.js';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'manager' | 'host' | 'player'>('home');
  const [activeQuizId, setActiveQuizId] = useState<string>('quiz-biblico-classico');
  const [initialPin, setInitialPin] = useState<string>('');

  useEffect(() => {
    // Detecta parâmetros de URL ao carregar a página
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin');
    const host = params.get('host');

    if (pin) {
      setInitialPin(pin);
      setCurrentView('player');
    } else if (host) {
      setActiveQuizId(host);
      setCurrentView('host');
    }
  }, []);

  const handleJoinWithPin = (pin: string) => {
    setInitialPin(pin);
    setCurrentView('player');
  };

  const handleStartHostQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentView('host');
  };

  const handleQuickStart = () => {
    setActiveQuizId('quiz-biblico-classico');
    setCurrentView('host');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Exibe Navbar em todas as telas exceto durante a apresentação no telão */}
      {currentView !== 'host' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {/* Conteúdo Principal de Acordo com a Tela Ativa */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <HomeView
            onJoinWithPin={handleJoinWithPin}
            onOpenManager={() => setCurrentView('manager')}
            onQuickStart={handleQuickStart}
          />
        )}

        {currentView === 'manager' && (
          <QuizManager
            onStartQuiz={handleStartHostQuiz}
          />
        )}

        {currentView === 'host' && (
          <HostView
            quizId={activeQuizId}
            onExit={() => setCurrentView('home')}
          />
        )}

        {currentView === 'player' && (
          <PlayerView
            initialPin={initialPin}
            onExit={() => setCurrentView('home')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
