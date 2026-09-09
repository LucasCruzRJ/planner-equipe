import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import { setupSockets } from './sockets.js';
import routes from './routes.js';
import { printNetworkBanner } from './ipHelper.js';
import { startCloudflareTunnel } from './tunnel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Inicializar banco de dados SQLite
initDatabase();

// Configurar WebSockets Socket.IO com suporte a conexões de qualquer computador da rede
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

setupSockets(io);

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Servir frontend compilado em modo de produção / uso compartilhado
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// Fallback SPA para qualquer rota do frontend que não seja /api
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escutar em todas as interfaces de rede (Wi-Fi, Ethernet, Localhost)

server.listen(PORT, HOST, () => {
  printNetworkBanner(PORT);

  // Iniciar túnel público seguro automaticamente para acesso fora da rede local
  startCloudflareTunnel(PORT, (url) => {
    console.log('='.repeat(60));
    console.log('🌐  LINK WEB GLOBAL PARA SUA EQUIPE (Funciona em QUALQUER lugar):');
    console.log(`    👉 ${url}`);
    console.log('    (Sem bloqueio de Wi-Fi, sem bloqueio de Firewall)');
    console.log('='.repeat(60) + '\n');
  });
});
