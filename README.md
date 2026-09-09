# 📋 Planner de Equipe - Gerenciador Colaborativo em Tempo Real

Um sistema completo de gerenciamento de tarefas e projetos para equipes de trabalho (estilo Microsoft Planner / Trello / ClickUp), com **sincronização instantânea entre múltiplos computadores** na mesma rede local (Wi-Fi/Ethernet) ou nuvem.

---

## ✨ Funcionalidades Principais

- **🔄 Sincronização ao Vivo (Multiplayer)**: Quando um colega cria, move ou edita uma tarefa, todos os outros computadores atualizam a tela na mesma hora via WebSockets (Socket.IO).
- **📊 4 Visualizações Poderosas**:
  1. **Quadro Kanban**: Colunas customizáveis (Buckets) com arrastar e soltar (Drag and Drop) fluido.
  2. **Lista Detalhada**: Tabela organizada com ordenação por prazos, prioridades e alteração rápida de status.
  3. **Calendário de Prazos**: Visão mensal interativa com alertas de entrega e criação por clique na data.
  4. **Painel de Estatísticas**: Métricas em tempo real de produtividade, taxa de conclusão e carga de trabalho por membro.
- **📝 Detalhes Completos da Tarefa**:
  - Título, descrição com notas ricas.
  - Atribuição de múltiplos responsáveis com avatares visuais coloridos.
  - Níveis de prioridade (*Urgente*, *Alta*, *Média*, *Baixa*).
  - Data de início e data de entrega com alertas visuais (*Vence hoje*, *Em atraso*, *No prazo*).
  - Checklist interativo com barra de progresso em porcentagem.
  - Etiquetas (Tags) coloridas com busca instantânea.
  - Histórico de comentários com autor e data/hora.
  - Efeito comemorativo de confetes ao concluir tarefas! 🎉
- **👥 Presença em Tempo Real**: Barra superior que mostra quem da equipe está online no momento.
- **🔍 Filtros e Busca Rápida**: Busca em tempo real por texto, filtros por responsável, prioridade, etiqueta, "Minhas Tarefas" e "Atrasadas".
- **📁 Múltiplos Planos/Projetos**: Crie e alterne facilmente entre projetos diferentes.
- **📥 Exportação de Relatórios**: Exportação direta das demandas em formato Excel (CSV) ou JSON.
- **💾 Banco de Dados Persistente**: Utiliza SQLite (`planner.db`), mantendo todos os dados seguros sem precisar de configurações complexas.

---

## 🚀 Como Iniciar e Usar

### 1. No seu computador (Computador Principal / Host):
Dê um duplo clique no arquivo:
```
iniciar_planner.bat
```
*(Ou abra o terminal nesta pasta e execute `npm start`)*

O sistema iniciará o servidor e abrirá automaticamente o navegador em `http://localhost:3000`.

---

### 2. Para os seus colegas acessarem de seus computadores:
1. Certifique-se de que os computadores dos colegas estejam conectados no **mesmo Wi-Fi ou rede de trabalho**.
2. No seu Planner, clique no botão **"Conectar Colegas"** no topo da tela (ou veja o endereço exibido no terminal preto ao iniciar).
3. Envie o endereço de **Rede Local** (ex: `http://192.168.1.15:3000`) para a sua equipe pelo WhatsApp, Teams, Slack ou e-mail.
4. Seus colegas só precisam clicar no link e o Planner abrirá direto no navegador deles, **sem precisar instalar nada**!

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, @hello-pangea/dnd, Canvas-Confetti
- **Backend**: Node.js, Express, Socket.IO, Better-SQLite3
- **Rede**: Detecção automática de interfaces IPv4 locais para fácil compartilhamento
