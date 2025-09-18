
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.static('public'));
// Serve index.html for /admin
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/health', (req, res) => res.send('ok'));


// Session state storage (in-memory for now)
let sessions = {};

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  // Admin joins session
  socket.on('admin-join', ({ sessionId }) => {
    socket.join(sessionId);
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        challenges: [
          "Matar a pico a 2 jugadores en la misma partida",
          "Solo puedes usar armas doradas",
          "Gana una partida sin construir",
          "Haz una eliminación con explosivos",
          "Sobrevive 5 minutos sin armas",
          "Consigue una victoria magistral",
          "No puedes usar escudos",
          "Solo puedes usar armas verdes",
          "Haz una eliminación con vehículo",
          "No puedes usar curaciones",
          "Elimina a un enemigo con trampa",
          "Haz una eliminación a larga distancia"
        ],
        jugadas: 0,
        ganadas: 0,
        selectedChallenge: null,
        countdown: '00:00:00'
      };
    }
    socket.emit('session-state', sessions[sessionId]);
    io.to(sessionId).emit('session-state', sessions[sessionId]);
  });

  // Overlay joins session
  socket.on('overlay-join', ({ sessionId }) => {
    socket.join(sessionId);
    if (sessions[sessionId]) {
      socket.emit('session-state', sessions[sessionId]);
    }
  });

  // Update challenges
  socket.on('update-challenges', ({ sessionId, challenges }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].challenges = challenges;
      io.to(sessionId).emit('session-state', sessions[sessionId]);
    }
  });

  // Spin wheel
  socket.on('spin-wheel', ({ sessionId }) => {
    if (sessions[sessionId]) {
      const n = sessions[sessionId].challenges.length;
      const idx = Math.floor(Math.random() * n);
      sessions[sessionId].selectedChallenge = idx;
      io.to(sessionId).emit('spin', { selected: idx, challenge: sessions[sessionId].challenges[idx] });
      io.to(sessionId).emit('session-state', sessions[sessionId]);
    }
  });

  // Update jugadas/ganadas
  socket.on('update-status', ({ sessionId, jugadas, ganadas }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].jugadas = jugadas;
      sessions[sessionId].ganadas = ganadas;
      io.to(sessionId).emit('session-state', sessions[sessionId]);
    }
  });

  // Reset data
  socket.on('reset-status', ({ sessionId }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].jugadas = 0;
      sessions[sessionId].ganadas = 0;
      sessions[sessionId].selectedChallenge = null;
      io.to(sessionId).emit('session-state', sessions[sessionId]);
    }
  });

  // Update countdown
  socket.on('update-countdown', ({ sessionId, countdown }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].countdown = countdown;
      io.to(sessionId).emit('session-state', sessions[sessionId]);
    }
  });
});

const port = process.env.PORT || 8083;
server.listen(port, () => console.log(`Zaurioking tools server listening on :${port}`));
