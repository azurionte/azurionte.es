import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 8080;

// ===== persistence (simple JSON en disco) =====
const SAVE_FILE = "./states.json";
let STATES = {};
try {
  if (fs.existsSync(SAVE_FILE)) STATES = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8") || "{}");
} catch { STATES = {}; }

let saveTimer = null;
const scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => {
  try { fs.writeFileSync(SAVE_FILE, JSON.stringify(STATES, null, 2)); } catch {}
}, 400); };

const defaultChallenges = [
  "Solo usar pistolas","No construir","Solo loot de cofres","Solo curarte con peces",
  "Kill con explosivos","Solo escopetas","Un color específico","No abrir cofres",
  "Solo vehículos para rotar","Solo loot primer lugar","No usar escudos","Kill con caída",
  "Solo armas automáticas","No loot de enemigos","Arma mítica o exótica","Solo NPCs",
  "Solo melee/granadas","Cambiar arma tras cada kill","Solo loot en agua","Máximo 3 kills"
];

function makeState() {
  const now = Date.now();
  return {
    title: "ZAURIOKING CHALLENGE",
    played: 0,
    wins: 0,
    angle: 0,
    spinning: false,
    spinId: null,
    challenges: defaultChallenges.map((t,i)=>({ id:`c${now}_${i}`, text:t, enabled:true }))
  };
}
function getRoom(roomId) {
  if (!STATES[roomId]) STATES[roomId] = makeState();
  return STATES[roomId];
}

// calcula el ángulo final para que el segmento elegido quede bajo el puntero (arriba)
function computeFinalAngle(state, chosenIndex) {
  const enabledIdxs = state.challenges.map((c,i)=>({c,i})).filter(o=>o.c.enabled).map(o=>o.i);
  const count = Math.max(enabledIdxs.length, 1);
  const idxInEnabled = enabledIdxs.indexOf(chosenIndex);
  const arc = (2*Math.PI)/count;
  const segmentCenter = (idxInEnabled + 0.5) * arc;
  const base = -Math.PI/2 - segmentCenter; // puntero arriba
  const spins = 6 + Math.floor(Math.random()*4); // 6..9 vueltas
  return base + spins*2*Math.PI;
}

io.on("connection", (socket)=>{
  let roomId = null;

  socket.on("join", (room)=>{
    roomId = String(room || "zaurio-roulette");
    socket.join(roomId);
    io.to(socket.id).emit("state", getRoom(roomId));
  });

  socket.on("set-title", (title)=>{
    if (!roomId) return;
    const s = getRoom(roomId);
    s.title = String(title||"").slice(0,80);
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("set-counter", ({played,wins})=>{
    if (!roomId) return;
    const s = getRoom(roomId);
    if (Number.isFinite(played)) s.played = Math.max(0, played|0);
    if (Number.isFinite(wins))   s.wins   = Math.max(0, wins|0);
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("inc-played", ()=>{
    if (!roomId) return; const s = getRoom(roomId);
    s.played++; io.to(roomId).emit("state", s); scheduleSave();
  });
  socket.on("inc-wins", ()=>{
    if (!roomId) return; const s = getRoom(roomId);
    s.wins++; io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("add-challenge", (text)=>{
    if (!roomId) return; const s = getRoom(roomId);
    s.challenges.push({ id:`c${Date.now()}_${Math.random().toString(36).slice(2)}`, text:String(text||"").slice(0,140), enabled:true });
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("toggle-challenge", (id)=>{
    if (!roomId) return; const s = getRoom(roomId);
    const c = s.challenges.find(x=>x.id===id); if (c) c.enabled = !c.enabled;
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("edit-challenge", ({id, text})=>{
    if (!roomId) return; const s = getRoom(roomId);
    const c = s.challenges.find(x=>x.id===id); if (c) c.text = String(text||"").slice(0,140);
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("remove-challenge", (id)=>{
    if (!roomId) return; const s = getRoom(roomId);
    s.challenges = s.challenges.filter(x=>x.id!==id);
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("reorder", (ids)=>{
    if (!roomId) return; const s = getRoom(roomId);
    const map = new Map(s.challenges.map(c=>[c.id,c]));
    s.challenges = ids.map(id=>map.get(id)).filter(Boolean);
    io.to(roomId).emit("state", s); scheduleSave();
  });

  socket.on("spin", ()=>{
    if (!roomId) return; const s = getRoom(roomId);
    if (s.spinning) return;
    const enabledIdxs = s.challenges.map((c,i)=>({c,i})).filter(o=>o.c.enabled).map(o=>o.i);
    if (enabledIdxs.length===0) return;

    s.spinning = true; s.spinId = `spin_${Date.now()}`;
    const chosen = enabledIdxs[Math.floor(Math.random()*enabledIdxs.length)];
    const finalAngle = computeFinalAngle(s, chosen);

    io.to(roomId).emit("spin-start", { spinId:s.spinId, finalAngle, index:chosen });

    setTimeout(()=>{
      s.angle = ((finalAngle % (2*Math.PI))+2*Math.PI)%(2*Math.PI);
      s.spinning = false;
      io.to(roomId).emit("spin-end", { spinId:s.spinId, finalAngle:s.angle, index:chosen });
      scheduleSave();
    }, 5200);
  });
});

server.listen(PORT, ()=>console.log(`Zaurioking Roulette live on :${PORT}`));
