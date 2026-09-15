# 🎉 QuizEBD - Plataforma de Quiz Interativo ao Vivo (Estilo Mentimeter / Kahoot)

Uma plataforma web moderna, rápida e em tempo real para criação e apresentação de quizzes interativos em salas de aula, EBD (Escola Bíblica Dominical), eventos e palestras.

Os participantes conectam-se pelo smartphone escaneando um **QR Code** ou digitando um **PIN de 6 dígitos**, respondem às perguntas diretamente pela tela do celular e disputam o pódio com cálculo dinâmico de acerto e **bônus por velocidade**, tudo **sem as limitações de perguntas ou participantes do plano gratuito do Mentimeter**.

---

## ✨ Funcionalidades Principais

1. **Sem Restrições do Plano Grátis do Mentimeter**:
   - **Perguntas Ilimitadas**: Crie quizzes com 5, 20 ou 100 perguntas.
   - **Participantes Ilimitados**: Suporta dezenas ou centenas de conexões simultâneas.
   - **100% Gratuito & Open-Source**: Sem assinaturas mensais.
2. **Modo Híbrido (Online e Offline via Wi-Fi)**:
   - Pode rodar na nuvem ou **diretamente no notebook do professor** conectado ao Wi-Fi da sala, gerando um QR Code automático com o IP da rede local. Não depende de sinal 4G ou internet rápida!
3. **Modos de Pontuação e Jogo**:
   - **Bônus por Velocidade (Estilo Mentimeter / Kahoot)**: Quem responde mais rápido ganha mais pontos.
   - **Modo Tradicional**: Pontuação fixa por acerto sem pressão de tempo.
   - **Modo Eliminatório**: Modo sobrevivência onde erros eliminam o participante.
4. **Interface do Telão (Projetor / TV)**:
   - Sala de espera (Lobby) com **QR Code gigante** e PIN de 6 dígitos.
   - Contagem regressiva 3.. 2.. 1.. animada.
   - Telão de perguntas com 4 alternativas coloridas de alto contraste (▲ ◆ ● ■).
   - Cronômetro visual e indicador em tempo real de quantas pessoas já responderam.
   - Revelação com **gráfico de barras** da distribuição de respostas e destaque na correta.
   - Exibição de **explicação bíblica / didática** e versículos de referência.
   - Placar da rodada com Top 10 e indicador de sequências de acertos (🔥 Streak).
   - **Pódio Olímpico Final (1º, 2º e 3º lugares)** com efeito de confetes e fanfarra.
5. **Interface dos Alunos (Mobile / Celular)**:
   - Entrada direta via câmera (QR Code) ou digitação de PIN.
   - Escolha de nome e avatar temático (🦁 Leão, 👑 Coroa, 🕊️ Pomba, ⚡ Raio, 📖 Bíblia, 🛡️ Escudo, etc.).
   - Visualização do enunciado e das alternativas **direto na tela do celular** (diferencial do Mentimeter).
   - Feedback tátil com vibração e travamento instantâneo pós-resposta.
   - Tela de resultado individual: "Você acertou! +950 pts" ou "Que pena, você errou!".
6. **Painel do Professor (Editor de Quizzes)**:
   - Criação, edição, duplicação e exclusão de quizzes.
   - Quizzes bíblicos pré-instalados prontos para uso ("Heróis da Fé" e "Curiosidades").
   - Importação e Exportação de backup em formato JSON.
   - Efeitos sonoros sintéticos via Web Audio API (funcionam 100% offline).

---

## 🚀 Como Executar

### 1. Iniciar a Plataforma (Modo Produção / Telão)
No terminal do projeto, execute:
```bash
npm start
```
O servidor inicializará e exibirá no terminal:
```text
=================================================
🎉 QUIZ AO VIVO INICIADO COM SUCESSO!
👉 Acesso Local (PC do Professor): http://localhost:3001
📱 Acesso dos Celulares (Wi-Fi):   http://192.168.1.XXX:3001
=================================================
```

Abra `http://localhost:3001` no navegador do seu computador ou notebook ligado ao projetor.

### 2. Conexão dos Alunos pelo Celular
- O telão exibirá um **QR Code gigante** na tela inicial do jogo.
- Os alunos abrem a câmera do smartphone, apontam para o telão e são direcionados diretamente para o quiz, com o PIN já preenchido!
- Alternativamente, os alunos podem digitar o endereço do Wi-Fi exibido na tela.

### 3. Modo Desenvolvimento
Caso deseje editar ou customizar o código-fonte em tempo real com Hot Reload:
```bash
npm run dev
```

---

## 📁 Estrutura do Projeto

```text
quiz-ebd/
├── client/                     # Frontend React + Tailwind CSS v4 + Lucide
│   ├── src/
│   │   ├── components/
│   │   │   ├── HostView.tsx    # Tela do Telão / Projetor (Lobby, Pergunta, Placar, Pódio)
│   │   │   ├── PlayerView.tsx  # Tela do Aluno no Celular
│   │   │   ├── QuizManager.tsx # Criador & Editor de Quizzes
│   │   │   ├── HomeView.tsx    # Portal inicial
│   │   │   └── Navbar.tsx      # Barra de navegação e status de rede
│   │   ├── services/
│   │   │   └── socket.ts       # Conexão Socket.IO com fallback inteligente
│   │   ├── utils/
│   │   │   └── audio.ts        # Efeitos sonoros Web Audio API (Zero arquivos externos)
│   │   └── types.ts            # Tipos de dados
│   └── dist/                   # Frontend compilado pronto para servir
├── server/                     # Backend Node.js + Express + Socket.IO
│   ├── game/
│   │   └── GameManager.ts      # Motor autoritativo da partida e cálculo de velocidade
│   ├── storage.ts              # Persistência de quizzes em JSON com quizzes de exemplo
│   ├── network.ts              # Detecção automática de IP para rede local (Wi-Fi)
│   ├── types.ts                # Tipos de dados do servidor
│   └── index.ts                # Servidor Express e WebSockets
├── data/
│   └── quizzes.json            # Banco de quizzes persistente
├── scripts/
│   └── test-gameplay.ts        # Teste automatizado de simulação ponta a ponta
└── package.json
```

---

## ☁️ Como Hospedar Gratuitamente na Nuvem

Se desejar que participantes em qualquer lugar do mundo participem através da internet:
1. **Render.com (Recomendado)**:
   - Crie uma conta gratuita em [render.com](https://render.com).
   - Conecte este repositório como um **Web Service**.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - O Render gerará uma URL HTTPS gratuita (ex: `https://seu-quiz.onrender.com`).
2. **Railway / Fly.io**:
   - Compatível diretamente com o comando `npm start`.
