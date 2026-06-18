const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Load Questions ───
let questions = [];
const questionsFile = path.join(__dirname, 'questions.json');
try {
  if (fs.existsSync(questionsFile)) {
    questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
  }
} catch (e) {
  console.error("Error loading questions:", e);
}

function saveQuestions() {
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
}

// ─── Admin API Routes ───
app.get('/api/questions', (req, res) => res.json(questions));
app.post('/api/questions', (req, res) => {
  const newQ = req.body;
  questions.push(newQ);
  saveQuestions();
  res.json({ success: true, question: newQ });
});
app.put('/api/questions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id >= 0 && id < questions.length) {
    questions[id] = req.body;
    saveQuestions();
    res.json({ success: true, question: questions[id] });
  } else {
    res.status(404).json({ error: 'Question not found' });
  }
});
app.delete('/api/questions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id >= 0 && id < questions.length) {
    questions.splice(id, 1);
    saveQuestions();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Question not found' });
  }
});

// ─── Game Config ───
const GAME_DURATION = 180; 
const LAST_BOSS_TIME = 30; 
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1600;
const MONSTER_SPAWN_INTERVAL = 6000;
const MAX_MONSTERS = 8;
const PLAYER_ATTACK_DAMAGE = 10;
const ATTACK_RANGE = 60;

const MONSTER_TYPES = [
  { name: 'สไลม์', emoji: '🟢', hp: 30, color: '#4ade80', size: 36, xp: 10 },
  { name: 'ค้างคาว', emoji: '🦇', hp: 40, color: '#a78bfa', size: 32, xp: 15 },
  { name: 'หมาป่า', emoji: '🐺', hp: 50, color: '#94a3b8', size: 40, xp: 20 },
  { name: 'โกเลม', emoji: '🗿', hp: 70, color: '#f59e0b', size: 48, xp: 25 },
  { name: 'มังกรน้อย', emoji: '🐉', hp: 90, color: '#ef4444', size: 44, xp: 30 },
];
const LAST_BOSS_TEMPLATE = {
  name: '⚡ จอมมารแห่งความรู้ ⚡', emoji: '👹', hp: 300, color: '#dc2626', size: 72, xp: 100, isLastBoss: true,
};
const PLAYER_COLORS = ['#f472b6', '#60a5fa', '#4ade80', '#facc15', '#c084fc', '#fb923c', '#2dd4bf', '#f87171'];

// ─── Rooms State ───
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for(let i=0; i<4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  } while(rooms[code]);
  return code;
}

function getRandomQuestion(usedSet) {
  if (!questions || questions.length === 0) {
    return {
      question: 'ข้อใดคือเมืองหลวงของประเทศไทย?',
      choices: ['เชียงใหม่', 'ภูเก็ต', 'กรุงเทพมหานคร', 'ขอนแก่น'],
      correctAnswer: 2,
      explanation: 'เป็นคำถามสำรองเนื่องจากไม่มีคำถามในระบบ',
      index: 0
    };
  }
  if (usedSet.size >= questions.length) usedSet.clear();
  let idx;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * questions.length);
    attempts++;
    if (attempts > 100) break; 
  } while (usedSet.has(idx));
  usedSet.add(idx);
  return { ...questions[idx], index: idx };
}

function getRandomPosition(padding = 100) {
  return {
    x: padding + Math.random() * (MAP_WIDTH - padding * 2),
    y: padding + Math.random() * (MAP_HEIGHT - padding * 2),
  };
}

function spawnRoomMonster(room, forceType = null) {
  if (Object.keys(room.monsters).length >= MAX_MONSTERS && !forceType) return;
  const id = 'mon_' + room.monsterIdCounter++;
  const template = forceType || MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
  const pos = getRandomPosition(150);
  room.monsters[id] = { id, ...template, currentHp: template.hp, x: pos.x, y: pos.y, spawnTime: Date.now(), attackedBy: {} };
  io.to(room.code).emit('monsterSpawned', room.monsters[id]);
}

function startRoomGame(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.gameActive) return;
  
  room.gameActive = true;
  room.timeRemaining = GAME_DURATION;
  room.lastBossSpawned = false;
  room.monsters = {};
  room.monsterIdCounter = 0;
  room.usedQuestionIndices.clear();

  Object.values(room.players).forEach(p => {
    p.score = 0; p.monstersKilled = 0; p.correctAnswers = 0; p.pendingQuestion = null;
    const pos = getRandomPosition(200);
    p.x = pos.x; p.y = pos.y;
  });

  for (let i = 0; i < 4; i++) spawnRoomMonster(room);

  room.monsterSpawner = setInterval(() => {
    if (room.gameActive && Object.keys(room.monsters).length < MAX_MONSTERS && !room.isPaused) spawnRoomMonster(room);
  }, MONSTER_SPAWN_INTERVAL);

  room.gameTimer = setInterval(() => {
    if (room.isPaused) return;
    room.timeRemaining--;
    if (room.timeRemaining === LAST_BOSS_TIME && !room.lastBossSpawned) {
      room.lastBossSpawned = true;
      const id = 'boss_final';
      room.monsters[id] = { id, ...LAST_BOSS_TEMPLATE, currentHp: LAST_BOSS_TEMPLATE.hp, x: MAP_WIDTH/2, y: MAP_HEIGHT/2, spawnTime: Date.now(), attackedBy: {} };
      io.to(room.code).emit('lastBossSpawned', room.monsters[id]);
      io.to(room.code).emit('announcement', { text: '⚡ จอมมารแห่งความรู้ปรากฏตัว! ⚡', type: 'boss' });
    }
    io.to(room.code).emit('timerUpdate', { timeRemaining: room.timeRemaining, totalTime: GAME_DURATION });
    if (room.timeRemaining <= 0) endRoomGame(roomCode);
  }, 1000);

  io.to(room.code).emit('gameStarted', {
    timeRemaining: room.timeRemaining,
    totalTime: GAME_DURATION,
    monsters: room.monsters,
    players: getPublicPlayers(room),
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT
  });
  io.to(room.code).emit('announcement', { text: '🎮 เกมเริ่มแล้ว! ล่ามอนสเตอร์และตอบคำถามเพื่อทำคะแนน!', type: 'start' });
}

function endRoomGame(roomCode) {
  const room = rooms[roomCode];
  if(!room) return;
  room.gameActive = false;
  clearInterval(room.gameTimer);
  clearInterval(room.monsterSpawner);
  const rankings = Object.values(room.players)
    .map(p => ({ name: p.name, score: p.score, monstersKilled: p.monstersKilled, correctAnswers: p.correctAnswers, color: p.color }))
    .sort((a, b) => b.score - a.score);
  io.to(room.code).emit('gameEnded', { rankings });
}

function getPublicPlayers(room) {
  const pub = {};
  Object.keys(room.players).forEach(id => {
    const p = room.players[id];
    pub[id] = { id, name: p.name, x: p.x, y: p.y, color: p.color, score: p.score, direction: p.direction, isAttacking: p.isAttacking, monstersKilled: p.monstersKilled };
  });
  return pub;
}

// ─── Socket.io ───
io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('createRoom', (data) => {
    const code = generateRoomCode();
    const maxPlayers = parseInt(data.maxPlayers) || 2;
    
    rooms[code] = {
      code,
      maxPlayers,
      players: {},
      monsters: {},
      gameActive: false,
      usedQuestionIndices: new Set(),
      monsterIdCounter: 0,
      pauseVotes: new Set(),
      isPaused: false
    };
    
    joinRoomLogic(socket, code, data.name);
  });

  socket.on('joinRoom', (data) => {
    const code = (data.code || '').toUpperCase();
    if (!rooms[code]) return socket.emit('errorMsg', 'ไม่พบห้องนี้!');
    if (rooms[code].gameActive) return socket.emit('errorMsg', 'ห้องนี้เริ่มเกมไปแล้ว!');
    if (Object.keys(rooms[code].players).length >= rooms[code].maxPlayers) return socket.emit('errorMsg', 'ห้องเต็มแล้ว!');
    
    joinRoomLogic(socket, code, data.name);
  });

  function joinRoomLogic(socket, code, playerName) {
    const room = rooms[code];
    currentRoom = code;
    socket.join(code);
    
    const colorIndex = Object.keys(room.players).length % PLAYER_COLORS.length;

    room.players[socket.id] = {
      id: socket.id,
      name: playerName || 'ผู้กล้า',
      x: 0, y: 0, // Assigned later
      color: PLAYER_COLORS[colorIndex],
      score: 0, monstersKilled: 0, correctAnswers: 0,
      direction: 'down', isAttacking: false, pendingQuestion: null,
    };

    const currentCount = Object.keys(room.players).length;

    socket.emit('joinedLobby', {
      roomCode: code,
      maxPlayers: room.maxPlayers,
      currentPlayers: currentCount,
      players: Object.values(room.players).map(p => ({ id: p.id, name: p.name, color: p.color }))
    });

    socket.to(code).emit('lobbyUpdate', {
      currentPlayers: currentCount,
      maxPlayers: room.maxPlayers,
      players: Object.values(room.players).map(p => ({ id: p.id, name: p.name, color: p.color }))
    });

    if (currentCount >= room.maxPlayers) {
      io.to(code).emit('lobbyCountdown', 3);
      setTimeout(() => startRoomGame(code), 3000);
    }
  }

  socket.on('playerMove', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const p = rooms[currentRoom].players[socket.id];
    if(!p) return;
    p.x = Math.max(20, Math.min(MAP_WIDTH - 20, data.x));
    p.y = Math.max(20, Math.min(MAP_HEIGHT - 20, data.y));
    p.direction = data.direction || p.direction;
    socket.to(currentRoom).emit('playerMoved', { id: socket.id, x: p.x, y: p.y, direction: p.direction });
  });

  socket.on('attackMonster', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    if (!room.gameActive) return;
    
    const player = room.players[socket.id];
    const monster = room.monsters[data.monsterId];
    if (!player || !monster || player.pendingQuestion) return;

    const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
    if (dist > ATTACK_RANGE + monster.size) return;

    player.isAttacking = true;
    io.to(currentRoom).emit('playerAttack', { playerId: socket.id, monsterId: data.monsterId });

    if (!monster.attackedBy[socket.id]) monster.attackedBy[socket.id] = 0;
    monster.attackedBy[socket.id] += PLAYER_ATTACK_DAMAGE;
    monster.currentHp -= PLAYER_ATTACK_DAMAGE;

    io.to(currentRoom).emit('monsterDamaged', { monsterId: monster.id, currentHp: monster.currentHp, maxHp: monster.hp, attackerId: socket.id, damage: PLAYER_ATTACK_DAMAGE });

    if (monster.currentHp <= 0) {
      const question = getRandomQuestion(room.usedQuestionIndices);
      player.pendingQuestion = { ...question, monsterId: monster.id, monsterXp: monster.xp, isLastBoss: monster.isLastBoss || false };
      
      io.to(currentRoom).emit('monsterDefeated', { monsterId: monster.id, killedBy: socket.id, playerName: player.name, monsterName: monster.name });
      delete room.monsters[monster.id];

      socket.emit('showQuestion', { question: question.question, choices: question.choices, monsterId: data.monsterId, monsterName: monster.name, xp: monster.xp, isLastBoss: monster.isLastBoss || false });
    }
    setTimeout(() => { if (room.players[socket.id]) room.players[socket.id].isAttacking = false; }, 300);
  });

  socket.on('togglePause', () => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    if (!room.gameActive) return;

    if (room.pauseVotes.has(socket.id)) {
      room.pauseVotes.delete(socket.id);
    } else {
      room.pauseVotes.add(socket.id);
    }

    const playerCount = Object.keys(room.players).length;
    if (room.pauseVotes.size >= playerCount && playerCount > 0) {
      room.isPaused = !room.isPaused;
      room.pauseVotes.clear();
      io.to(currentRoom).emit('gamePaused', { isPaused: room.isPaused });
      io.to(currentRoom).emit('announcement', { text: room.isPaused ? '⏸️ เกมถูกพักชั่วคราว!' : '▶️ เล่นเกมต่อได้!', type: 'boss' });
      io.to(currentRoom).emit('pauseStatus', { votes: 0, total: playerCount, isPaused: room.isPaused });
    } else {
      io.to(currentRoom).emit('pauseStatus', { votes: room.pauseVotes.size, total: playerCount, isPaused: room.isPaused });
    }
  });

  socket.on('leaveRoom', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.players[socket.id]) {
        const pName = room.players[socket.id].name;
        delete room.players[socket.id];
        socket.leave(currentRoom);

        if (room.gameActive) {
          io.to(currentRoom).emit('playerLeft', { id: socket.id, name: pName });
          io.to(currentRoom).emit('announcement', { text: `👋 ${pName} ออกจากเกม`, type: 'leave' });
          
          // Check if pause votes need to be resolved after someone leaves
          if (room.pauseVotes.has(socket.id)) room.pauseVotes.delete(socket.id);
          const newTotal = Object.keys(room.players).length;
          if (newTotal > 0 && room.pauseVotes.size >= newTotal && !room.isPaused) {
            room.isPaused = true;
            room.pauseVotes.clear();
            io.to(currentRoom).emit('gamePaused', { isPaused: true });
          }
          io.to(currentRoom).emit('pauseStatus', { votes: room.pauseVotes.size, total: newTotal, isPaused: room.isPaused });
        } else {
          io.to(currentRoom).emit('lobbyUpdate', {
            currentPlayers: Object.keys(room.players).length,
            maxPlayers: room.maxPlayers,
            players: Object.values(room.players).map(p => ({ id: p.id, name: p.name, color: p.color }))
          });
        }

        if (Object.keys(room.players).length === 0) {
          if (room.gameTimer) clearInterval(room.gameTimer);
          if (room.monsterSpawner) clearInterval(room.monsterSpawner);
          delete rooms[currentRoom];
        }
      }
      currentRoom = null;
    }
  });

  socket.on('answerQuestion', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const room = rooms[currentRoom];
    const player = room.players[socket.id];
    if (!player || !player.pendingQuestion) return;

    const pq = player.pendingQuestion;
    const isCorrect = data.answer === pq.correctAnswer;
    const points = isCorrect ? (pq.isLastBoss ? pq.monsterXp * 3 : pq.monsterXp) : 0;

    if (isCorrect) {
      player.score += points; player.correctAnswers++; player.monstersKilled++;
      socket.emit('answerResult', { correct: true, points, explanation: pq.explanation, newScore: player.score });
      io.to(currentRoom).emit('scoreUpdate', { playerId: socket.id, playerName: player.name, score: player.score, points });
      io.to(currentRoom).emit('announcement', { text: `✅ ${player.name} ตอบถูก! +${points} คะแนน`, type: 'correct' });
    } else {
      player.monstersKilled++;
      socket.emit('answerResult', { correct: false, points: 0, correctAnswer: pq.correctAnswer, explanation: pq.explanation, newScore: player.score });
      io.to(currentRoom).emit('announcement', { text: `❌ ${player.name} ตอบผิด ไม่ได้คะแนน`, type: 'wrong' });
    }
    player.pendingQuestion = null;
    io.to(currentRoom).emit('leaderboardUpdate', getPublicPlayers(room));
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      if (room.players[socket.id]) {
        const pName = room.players[socket.id].name;
        delete room.players[socket.id];
        
        if (room.gameActive) {
          io.to(currentRoom).emit('playerLeft', { id: socket.id, name: pName });
          io.to(currentRoom).emit('announcement', { text: `👋 ${pName} ออกจากเกม`, type: 'leave' });
        } else {
          const currentCount = Object.keys(room.players).length;
          io.to(currentRoom).emit('lobbyUpdate', {
            currentPlayers: currentCount,
            maxPlayers: room.maxPlayers,
            players: Object.values(room.players).map(p => ({ id: p.id, name: p.name, color: p.color }))
          });
        }
        
        if (Object.keys(room.players).length === 0) {
          if(room.gameTimer) clearInterval(room.gameTimer);
          if(room.monsterSpawner) clearInterval(room.monsterSpawner);
          delete rooms[currentRoom];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Game server running on http://localhost:${PORT}`);
});
