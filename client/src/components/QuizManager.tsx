import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Copy, 
  Download, 
  Upload, 
  Check, 
  Award, 
  BookOpen, 
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { Quiz, Question, GameMode } from '../types.js';
import { soundManager } from '../utils/audio.js';

interface QuizManagerProps {
  onStartQuiz: (quizId: string) => void;
}

export const QuizManager: React.FC<QuizManagerProps> = ({ onStartQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('Erro ao carregar quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartCreate = () => {
    soundManager.playClick();
    const newQuiz: Quiz = {
      id: '',
      title: 'Novo Quiz Interativo',
      description: 'Quiz criado para dinamizar a aula.',
      category: 'EBD / Estudo',
      gameMode: 'speed_bonus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: `q-${Date.now()}-1`,
          text: 'Qual é a primeira pergunta do seu quiz?',
          timeLimit: 20,
          points: 1000,
          explanation: 'Explicação bíblica ou didática do porquê esta resposta é a correta.',
          options: [
            { id: 'opt-1', text: 'Opção A', isCorrect: true },
            { id: 'opt-2', text: 'Opção B', isCorrect: false },
            { id: 'opt-3', text: 'Opção C', isCorrect: false },
            { id: 'opt-4', text: 'Opção D', isCorrect: false },
          ],
        },
      ],
    };
    setEditingQuiz(newQuiz);
    setIsCreating(true);
  };

  const handleEdit = (quiz: Quiz) => {
    soundManager.playClick();
    setEditingQuiz(JSON.parse(JSON.stringify(quiz)));
    setIsCreating(false);
  };

  const handleDuplicate = async (quiz: Quiz) => {
    soundManager.playClick();
    const duplicated: Partial<Quiz> = {
      ...JSON.parse(JSON.stringify(quiz)),
      id: undefined,
      title: `${quiz.title} (Cópia)`,
    };
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error('Erro ao duplicar:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este quiz?')) return;
    soundManager.playClick();
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz) return;
    soundManager.playClick();

    if (!editingQuiz.title.trim()) {
      alert('Por favor, informe um título para o quiz.');
      return;
    }

    if (editingQuiz.questions.length === 0) {
      alert('O quiz precisa ter pelo menos 1 pergunta.');
      return;
    }

    // Validação das opções
    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const q = editingQuiz.questions[i];
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        alert(`A pergunta #${i + 1} precisa ter pelo menos uma alternativa marcada como correta!`);
        return;
      }
    }

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuiz),
      });

      if (res.ok) {
        setEditingQuiz(null);
        await fetchQuizzes();
      } else {
        alert('Erro ao salvar quiz.');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quizzes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `quizzes-ebd-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const toImport = Array.isArray(json) ? json : [json];
        const res = await fetch('/api/quizzes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toImport),
        });
        if (res.ok) {
          alert('Quizzes importados com sucesso!');
          await fetchQuizzes();
        } else {
          alert('Falha ao importar o arquivo.');
        }
      } catch (err) {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  // Funções do Editor de Perguntas
  const addQuestion = () => {
    if (!editingQuiz) return;
    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: `Pergunta ${editingQuiz.questions.length + 1}`,
      timeLimit: 20,
      points: 1000,
      explanation: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: 'Alternativa 1', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: 'Alternativa 2', isCorrect: false },
        { id: `opt-${Date.now()}-3`, text: 'Alternativa 3', isCorrect: false },
        { id: `opt-${Date.now()}-4`, text: 'Alternativa 4', isCorrect: false },
      ],
    };
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQ],
    });
  };

  const removeQuestion = (idx: number) => {
    if (!editingQuiz || editingQuiz.questions.length <= 1) {
      alert('O quiz precisa ter pelo menos 1 pergunta.');
      return;
    }
    const updated = [...editingQuiz.questions];
    updated.splice(idx, 1);
    setEditingQuiz({ ...editingQuiz, questions: updated });
  };

  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!editingQuiz) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editingQuiz.questions.length) return;

    const list = [...editingQuiz.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    setEditingQuiz({ ...editingQuiz, questions: list });
  };

  const setCorrectOption = (qIdx: number, optId: string) => {
    if (!editingQuiz) return;
    const questions = [...editingQuiz.questions];
    const q = { ...questions[qIdx] };
    q.options = q.options.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optId,
    }));
    questions[qIdx] = q;
    setEditingQuiz({ ...editingQuiz, questions });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-400" /> Meus Quizzes & Avaliações
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Crie perguntas ilimitadas, organize por temas e apresente ao vivo na aula.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors">
            <Upload className="w-4 h-4" /> Importar JSON
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExportAll}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar Backup
          </button>

          <button
            onClick={handleStartCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Criar Novo Quiz
          </button>
        </div>
      </div>

      {/* Lista de Quizzes */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Carregando seus quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 space-y-4">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Nenhum quiz encontrado</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Você ainda não possui nenhum quiz criado. Clique no botão abaixo para começar agora mesmo!
          </p>
          <button
            onClick={handleStartCreate}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25"
          >
            Criar Meu Primeiro Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {quiz.category || 'Geral'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {quiz.questions.length} perguntas
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {quiz.description || 'Sem descrição.'}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Modo:{' '}
                    <strong className="text-slate-200">
                      {quiz.gameMode === 'speed_bonus'
                        ? 'Bônus por Velocidade'
                        : quiz.gameMode === 'traditional'
                        ? 'Tradicional (Fixo)'
                        : 'Eliminatório'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Botões de Ação do Card */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onStartQuiz(quiz.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> Apresentar no Telão
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleEdit(quiz)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(quiz)}
                    title="Duplicar Quiz"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    title="Excluir Quiz"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Painel de Edição de Quiz */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-6 flex justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-auto space-y-8 text-left">
            {/* Cabeçalho do Editor */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isCreating ? 'Criar Novo Quiz' : 'Editar Quiz'}
                </h2>
                <p className="text-xs text-slate-400">Configure as perguntas, tempo e pontuação.</p>
              </div>
              <button
                onClick={() => setEditingQuiz(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Informações Básicas do Quiz */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-300">Título do Quiz *</label>
                <input
                  type="text"
                  value={editingQuiz.title}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: Super Quiz de Gênesis"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Categoria</label>
                <input
                  type="text"
                  value={editingQuiz.category}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: EBD Jovens"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-300">Descrição</label>
                <input
                  type="text"
                  value={editingQuiz.description}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Breve descrição da dinâmica..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Estilo de Jogo</label>
                <select
                  value={editingQuiz.gameMode}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, gameMode: e.target.value as GameMode })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="speed_bonus">⚡ Bônus por Velocidade (Mentimeter)</option>
                  <option value="traditional">🎯 Tradicional (Pontos Fixos)</option>
                  <option value="elimination">⚔️ Eliminatório (Sobrevivência)</option>
                </select>
              </div>
            </div>

            {/* Lista de Perguntas */}
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Perguntas do Quiz ({editingQuiz.questions.length})</span>
                </h3>
                <button
                  onClick={addQuestion}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta
                </button>
              </div>

              <div className="space-y-6">
                {editingQuiz.questions.map((question, qIdx) => (
                  <div
                    key={question.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                      <span className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">
                          {qIdx + 1}
                        </span>
                        Pergunta #{qIdx + 1}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={qIdx === 0}
                          onClick={() => moveQuestion(qIdx, 'up')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={qIdx === editingQuiz.questions.length - 1}
                          onClick={() => moveQuestion(qIdx, 'down')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(qIdx)}
                          className="p-1 text-slate-400 hover:text-rose-400 ml-2"
                          title="Excluir pergunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Texto da Pergunta */}
                    <div>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => {
                          const list = [...editingQuiz.questions];
                          list[qIdx].text = e.target.value;
                          setEditingQuiz({ ...editingQuiz, questions: list });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Digite o enunciado da pergunta..."
                      />
                    </div>

                    {/* Configurações da Pergunta: Tempo & Pontos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Tempo Limite</label>
                        <select
                          value={question.timeLimit}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].timeLimit = parseInt(e.target.value, 10);
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          <option value={10}>10 segundos</option>
                          <option value={15}>15 segundos</option>
                          <option value={20}>20 segundos</option>
                          <option value={30}>30 segundos</option>
                          <option value={60}>60 segundos</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Pontos Base</label>
                        <select
                          value={question.points}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].points = parseInt(e.target.value, 10);
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                        >
                          <option value={500}>500 pontos</option>
                          <option value={1000}>1000 pontos (Padrão)</option>
                          <option value={2000}>2000 pontos (Dobro)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-400 block mb-1">Explicação / Referência Bíblica (Opcional)</label>
                        <input
                          type="text"
                          value={question.explanation || ''}
                          onChange={(e) => {
                            const list = [...editingQuiz.questions];
                            list[qIdx].explanation = e.target.value;
                            setEditingQuiz({ ...editingQuiz, questions: list });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                          placeholder="Ex: Gênesis 6:14 - A arca foi construída..."
                        />
                      </div>
                    </div>

                    {/* Alternativas de Resposta */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Alternativas (Marque o círculo da resposta correta):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((opt, optIdx) => {
                          const colors = [
                            'border-rose-500/40 focus-within:border-rose-500',
                            'border-blue-500/40 focus-within:border-blue-500',
                            'border-amber-500/40 focus-within:border-amber-500',
                            'border-emerald-500/40 focus-within:border-emerald-500',
                          ];
                          const symbols = ['▲', '◆', '●', '■'];

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 p-2 rounded-xl bg-slate-900 border ${colors[optIdx % colors.length]} transition-colors`}
                            >
                              <button
                                type="button"
                                onClick={() => setCorrectOption(qIdx, opt.id)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  opt.isCorrect
                                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                                title={opt.isCorrect ? 'Resposta Correta' : 'Marcar como Correta'}
                              >
                                {opt.isCorrect ? <Check className="w-4 h-4" /> : symbols[optIdx]}
                              </button>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const list = [...editingQuiz.questions];
                                  list[qIdx].options[optIdx].text = e.target.value;
                                  setEditingQuiz({ ...editingQuiz, questions: list });
                                }}
                                className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                                placeholder={`Alternativa ${optIdx + 1}...`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={addQuestion}
                  className="px-6 py-2 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-indigo-400 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar Outra Pergunta
                </button>
              </div>
            </div>

            {/* Rodapé de Ações */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuiz}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all"
              >
                Salvar Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
