const socket = io();

// ─── DOM Elements ───
const screens = {
  login: document.getElementById('loginScreen'),
  lobby: document.getElementById('lobbyScreen'),
  game: document.getElementById('gameScreen')
};
const loginInput = document.getElementById('playerName');
const createRoomBtn = document.getElementById('createRoomBtn');
const readyBtn = document.getElementById('readyBtn');
const maxPlayersInput = document.getElementById('maxPlayers');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
const leaveGameBtn = document.getElementById('leaveGameBtn');
const leaveGameOverBtn = document.getElementById('leaveGameOverBtn');
const pauseBtn = document.getElementById('pauseBtn');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

// HUD
const timeEl = document.getElementById('timerValue');
const timerFill = document.getElementById('timerFill');
const scoreEl = document.getElementById('scoreValue');
const announcementsEl = document.getElementById('announcements');
const leaderboardList = document.getElementById('leaderboardList');

// Modals
const qModal = document.getElementById('questionModal');
const qTitle = document.getElementById('qTitle');
const qMonsterInfo = document.getElementById('qMonsterInfo');
const qMonsterBadge = document.getElementById('qMonsterBadge');
const qText = document.getElementById('qText');
const qChoices = document.getElementById('qChoices');
const qResult = document.getElementById('qResult');

const goModal = document.getElementById('gameOverModal');
const rankingsList = document.getElementById('rankingsList');
const playAgainBtn = document.getElementById('playAgainBtn');

const hpValueEl = document.getElementById('hpValue');
const hpFillEl = document.getElementById('hpFill');
const youDiedModal = document.getElementById('youDiedModal');
const leaveDeathBtn = document.getElementById('leaveDeathBtn');
const spectateBtn = document.getElementById('spectateBtn');

// Mobile Controls
const mobileControls = document.getElementById('mobileControls');

// ─── Game State ───
let gameState = {
  active: false,
  myId: null,
  mapWidth: 2400,
  mapHeight: 1600,
  players: {},
  monsters: {},
  particles: [],
  floatingTexts: [],
  camera: { x: 0, y: 0, width: 0, height: 0 }
};

let lastMoveEmitTime = 0;

// ─── Input Handling ───
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
let isSpacePressed = false;
let moveDir = { x: 0, y: 0 };
const PLAYER_SPEED = 180; // pixels per second

window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  if (e.code === 'Space' && !isSpacePressed) {
    isSpacePressed = true;
    attemptAttack();
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  if (e.code === 'Space') isSpacePressed = false;
});

canvas.addEventListener('click', () => {
  if (gameState.active) attemptAttack();
});

// Mobile Controls setup
const hint = document.getElementById('controlsHint');
if(hint) hint.classList.add('hidden');

const dpadBtns = document.querySelectorAll('.dpad-btn');
dpadBtns.forEach(btn => {
  const press = (e) => {
    e.preventDefault();
    btn.classList.add('active');
    const dir = btn.dataset.dir;
    if (dir === 'up') keys.w = true;
    if (dir === 'down') keys.s = true;
    if (dir === 'left') keys.a = true;
    if (dir === 'right') keys.d = true;
  };
  const release = (e) => {
    e.preventDefault();
    btn.classList.remove('active');
    const dir = btn.dataset.dir;
    if (dir === 'up') keys.w = false;
    if (dir === 'down') keys.s = false;
    if (dir === 'left') keys.a = false;
    if (dir === 'right') keys.d = false;
  };

  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('touchcancel', release, { passive: false });
  
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
});

const attackBtn = document.getElementById('mobileAttackBtn');
const pressAttack = (e) => {
  e.preventDefault();
  attackBtn.classList.add('active');
  attemptAttack();
};
const releaseAttack = (e) => {
  e.preventDefault();
  attackBtn.classList.remove('active');
};
attackBtn.addEventListener('touchstart', pressAttack, { passive: false });
attackBtn.addEventListener('touchend', releaseAttack, { passive: false });
attackBtn.addEventListener('touchcancel', releaseAttack, { passive: false });
attackBtn.addEventListener('mousedown', pressAttack);
attackBtn.addEventListener('mouseup', releaseAttack);
attackBtn.addEventListener('mouseleave', releaseAttack);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gameState.camera.width = canvas.width;
  gameState.camera.height = canvas.height;
}
window.addEventListener('resize', resize);
resize();

// ─── Particles for Login ───
function initLoginParticles() {
  const container = document.getElementById('particles');
  if (!container) return; // Skip if element doesn't exist in the new UI theme
  container.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 40 + 10;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 5}s`;
    p.style.animationDuration = `${Math.random() * 5 + 5}s`;
    container.appendChild(p);
  }
}
initLoginParticles();

// ─── Character Customization ───
const availableClasses = ['knight', 'mage', 'archer', 'rogue'];
const classNames = { knight: 'อัศวิน (Knight)', mage: 'นักเวท (Mage)', archer: 'นักธนู (Archer)', rogue: 'โจร (Rogue)' };
let selectedClassIndex = 0;
const availableColors = ['#f472b6', '#60a5fa', '#4ade80', '#facc15', '#c084fc', '#fb923c', '#2dd4bf', '#f87171'];
let selectedColor = availableColors[0];
let selectedGender = 'm';

const charPreviewCanvas = document.getElementById('charPreviewCanvas');
const miniCharPreviewCanvas = document.getElementById('miniCharPreviewCanvas');
const characterModal = document.getElementById('characterModal');
const openCharModalBtn = document.getElementById('openCharModalBtn');
const closeCharModalBtn = document.getElementById('closeCharModalBtn');
const confirmCharBtn = document.getElementById('confirmCharBtn');
const charModalOverlay = document.getElementById('charModalOverlay');

const prevClassBtn = document.getElementById('prevClassBtn');
const nextClassBtn = document.getElementById('nextClassBtn');
const genderMBtn = document.getElementById('genderMBtn');
const genderFBtn = document.getElementById('genderFBtn');
const charClassLabel = document.getElementById('charClassLabel');
const colorPalette = document.getElementById('colorPalette');

function updateCharPreview() {
  const spriteType = availableClasses[selectedClassIndex];
  if (charClassLabel) charClassLabel.textContent = classNames[spriteType];
  
  if (typeof renderPlayerSprite === 'function') {
    if (charPreviewCanvas) {
      const ctx = charPreviewCanvas.getContext('2d');
      ctx.clearRect(0, 0, charPreviewCanvas.width, charPreviewCanvas.height);
      // Canvas is 120x120, center is 60,60. Scale 5 => 120 draw size
      renderPlayerSprite(ctx, { spriteType, gender: selectedGender, color: selectedColor, direction: 'down' }, 60, 60, 5);
    }
    if (miniCharPreviewCanvas) {
      const ctxMini = miniCharPreviewCanvas.getContext('2d');
      ctxMini.clearRect(0, 0, miniCharPreviewCanvas.width, miniCharPreviewCanvas.height);
      // Canvas is 64x64, center is 32,32. Scale 2.5 => 60 draw size
      renderPlayerSprite(ctxMini, { spriteType, gender: selectedGender, color: selectedColor, direction: 'down' }, 32, 32, 2.5);
    }
  }
  
  // Keep trying to update if image is not loaded yet
  setTimeout(updateCharPreview, 150);
}

// Modal handling
if (openCharModalBtn) openCharModalBtn.addEventListener('click', () => characterModal?.classList.remove('hidden'));
[closeCharModalBtn, confirmCharBtn, charModalOverlay].forEach(btn => {
  if (btn) btn.addEventListener('click', () => characterModal?.classList.add('hidden'));
});

if (prevClassBtn && nextClassBtn) {
  prevClassBtn.addEventListener('click', () => {
    selectedClassIndex = (selectedClassIndex - 1 + availableClasses.length) % availableClasses.length;
    updateCharPreview();
  });
  nextClassBtn.addEventListener('click', () => {
    selectedClassIndex = (selectedClassIndex + 1) % availableClasses.length;
    updateCharPreview();
  });
  
  if (genderMBtn && genderFBtn) {
    genderMBtn.addEventListener('click', () => {
      selectedGender = 'm';
      genderMBtn.classList.add('active');
      genderFBtn.classList.remove('active');
      updateCharPreview();
    });
    genderFBtn.addEventListener('click', () => {
      selectedGender = 'f';
      genderFBtn.classList.add('active');
      genderMBtn.classList.remove('active');
      updateCharPreview();
    });
  }
  
  if (colorPalette) {
    availableColors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      if (color === selectedColor) swatch.classList.add('selected');
      swatch.style.backgroundColor = color;
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = color;
        updateCharPreview();
      });
      colorPalette.appendChild(swatch);
    });
  }
  
  // Wait a bit for sprites.js to load fully if needed, though it's synchronous
  setTimeout(updateCharPreview, 100);
}

// ─── Socket Events ───


createRoomBtn.addEventListener('click', () => {
  const name = loginInput.value.trim() || 'ผู้กล้า';
  const maxPlayers = maxPlayersInput.value;
  const duration = parseInt(document.getElementById('gameDuration').value) || 180;
  const spriteType = availableClasses[selectedClassIndex];
  socket.emit('createRoom', { name, maxPlayers, duration, spriteType, color: selectedColor, gender: selectedGender });
});

joinRoomBtn.addEventListener('click', () => {
  const name = loginInput.value.trim() || 'ผู้กล้าไร้นาม';
  const code = roomCodeInput.value.trim();
  if(!code) return alert('กรุณาใส่รหัสห้อง!');
  const spriteType = availableClasses[selectedClassIndex];
  socket.emit('joinRoom', { name, code, spriteType, color: selectedColor, gender: selectedGender });
});

socket.on('errorMsg', (msg) => {
  alert(msg);
});

[leaveLobbyBtn, leaveGameBtn, leaveGameOverBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => {
    socket.emit('leaveRoom');
    window.location.reload();
  });
});

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    socket.emit('togglePause');
  });
}

socket.on('pauseStatus', (data) => {
  if (pauseBtn) {
    pauseBtn.textContent = `⏸️ พักเกม (${data.votes}/${data.total})`;
    if (data.isPaused) pauseBtn.textContent = `▶️ เล่นต่อ (${data.votes}/${data.total})`;
  }
});

socket.on('gamePaused', (data) => {
  gameState.isPaused = data.isPaused;
  if (pauseBtn) {
    pauseBtn.textContent = data.isPaused ? `▶️ เล่นต่อ (0/0)` : `⏸️ พักเกม`;
  }
});

socket.on('joinedLobby', (data) => {
  screens.login.classList.remove('active');
  screens.lobby.classList.add('active');
  
  gameState.myId = socket.id;
  document.getElementById('lobbyRoomCode').textContent = data.roomCode;
  updateLobbyUI(data.currentPlayers, data.maxPlayers, data.players);
});

socket.on('lobbyUpdate', (data) => {
  updateLobbyUI(data.currentPlayers, data.maxPlayers, data.players);
});

function updateLobbyUI(current, max, players) {
  document.getElementById('lobbyCount').textContent = current;
  document.getElementById('lobbyMax').textContent = max;
  
  const list = document.getElementById('lobbyPlayers');
  list.innerHTML = '';
  players.forEach(p => {
    const el = document.createElement('div');
    el.style.padding = '10px';
    el.style.border = '2px solid #8b4513';
    el.style.borderRadius = '4px';
    el.style.background = 'rgba(255,255,255,0.8)';
    el.style.color = '#5d4037';
    el.style.fontWeight = 'bold';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '10px';
    const readyMark = p.ready !== undefined ? (p.ready ? ' ✅ พร้อม' : ' ⏳ รอ') : '';
    
    el.innerHTML = `
      <div style="width:16px; height:16px; border-radius:50%; background-color:${p.color}; border:2px solid #3e2723;"></div>
      <div style="font-weight:bold; color:var(--text-dark);">${p.name} ${p.id === socket.id ? '(คุณ)' : ''}${readyMark}</div>
    `;
    list.appendChild(el);
  });
}

socket.on('lobbyCountdown', (sec) => {
  document.getElementById('lobbyStatus').textContent = `กำลังเตรียมเปิดประตูมิติใน ${sec}...`;
});

socket.on('gameStarted', (data) => {
  if (typeof AudioManager !== 'undefined') AudioManager.playBGM('battle');
  screens.lobby.classList.remove('active');
  screens.game.classList.add('active');
  
  gameState.mapWidth = data.mapWidth;
  gameState.mapHeight = data.mapHeight;
  gameState.monsters = data.monsters;
  gameState.players = data.players;
  gameState.active = true;
  scoreEl.textContent = '0';
  hpValueEl.textContent = '100';
  hpFillEl.style.width = '100%';
  updateLeaderboard();
  goModal.classList.add('hidden');
  youDiedModal.classList.add('hidden');
  qModal.classList.add('hidden');
  
  requestAnimationFrame(gameLoop);
});

socket.on('playerLeft', (data) => {
  if (gameState.players[data.id]) {
    delete gameState.players[data.id];
    updateLeaderboard();
  }
});

socket.on('playerMoved', (data) => {
  if (gameState.players[data.id]) {
    gameState.players[data.id].x = data.x;
    gameState.players[data.id].y = data.y;
    gameState.players[data.id].direction = data.direction;
  }
});

socket.on('timerUpdate', (data) => {
  const mins = Math.floor(data.timeRemaining / 60);
  const secs = data.timeRemaining % 60;
  timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  
  const pct = (data.timeRemaining / data.totalTime) * 100;
  timerFill.style.width = `${pct}%`;
  
  if (data.timeRemaining <= 30) {
    timerFill.classList.add('danger');
  } else {
    timerFill.classList.remove('danger');
  }
});

socket.on('monsterSpawned', (monster) => {
  gameState.monsters[monster.id] = monster;
  createSpawnEffect(monster.x, monster.y, monster.color);
});

socket.on('lastBossSpawned', (boss) => {
  if (typeof AudioManager !== 'undefined') {
    AudioManager.playBGM('boss');
    AudioManager.playSFX('boss_spawn');
  }
  gameState.monsters[boss.id] = boss;
  createSpawnEffect(boss.x, boss.y, boss.color, true);
  // Shake screen effect
  document.body.style.animation = 'shake 0.5s';
  setTimeout(() => document.body.style.animation = '', 500);
});

socket.on('playerAttack', (data) => {
  if (gameState.players[data.playerId]) {
    gameState.players[data.playerId].isAttacking = true;
    setTimeout(() => {
      if (gameState.players[data.playerId]) {
        gameState.players[data.playerId].isAttacking = false;
      }
    }, 200);
    
    // Attack visual effect
    const p = gameState.players[data.playerId];
    createAttackEffect(p.x, p.y, p.direction);
  }
});

socket.on('monsterDamaged', (data) => {
  if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
  if (gameState.monsters[data.monsterId]) {
    gameState.monsters[data.monsterId].currentHp = data.currentHp;
    createDamageText(gameState.monsters[data.monsterId].x, gameState.monsters[data.monsterId].y, data.damage);
  }
});

socket.on('monsterDefeated', (data) => {
  if (typeof AudioManager !== 'undefined') AudioManager.playSFX('kill');
  if (gameState.monsters[data.monsterId]) {
    const m = gameState.monsters[data.monsterId];
    createDeathEffect(m.x, m.y, m.color);
    delete gameState.monsters[data.monsterId];
  }
});

socket.on('scoreUpdate', (data) => {
  if (gameState.players[data.playerId]) {
    gameState.players[data.playerId].score = data.score;
  }
  if (data.playerId === gameState.myId) {
    scoreEl.textContent = data.score;
    scoreEl.style.transform = 'scale(1.5)';
    setTimeout(() => scoreEl.style.transform = 'scale(1)', 200);
  }
  updateLeaderboard();
});

socket.on('announcement', (data) => {
  const el = document.createElement('div');
  el.className = `announcement ${data.type}`;
  el.textContent = data.text;
  announcementsEl.appendChild(el);
  setTimeout(() => el.remove(), 3000);
});

socket.on('leaderboardUpdate', (players) => {
  gameState.players = players;
  updateLeaderboard();
});

socket.on('hpUpdate', (data) => {
  if (gameState.players[data.playerId]) {
    gameState.players[data.playerId].hp = data.hp;
    gameState.players[data.playerId].maxHp = data.maxHp;
    gameState.players[data.playerId].isDead = data.isDead;
    createDamageText(gameState.players[data.playerId].x, gameState.players[data.playerId].y, data.damage);
  }
  if (data.playerId === gameState.myId) {
    hpValueEl.textContent = data.hp;
    hpFillEl.style.width = Math.max(0, (data.hp / data.maxHp) * 100) + '%';
    
    // Screen shake
    screens.game.classList.add('shake');
    setTimeout(() => screens.game.classList.remove('shake'), 300);
  }
});

socket.on('playerDied', (data) => {
  if (gameState.players[data.playerId]) {
    gameState.players[data.playerId].isDead = true;
  }
  if (data.playerId === gameState.myId) {
    youDiedModal.classList.remove('hidden');
    qModal.classList.add('hidden');
  }
});

// ─── Question System ───
let currentQuestionCallback = null;

socket.on('showQuestion', (data) => {
  qModal.classList.remove('hidden');
  qResult.classList.add('hidden');
  
  if (data.isLastBoss) {
    qMonsterBadge.textContent = '👹';
    qTitle.textContent = 'คำถามจากจอมมาร!';
    qTitle.style.color = '#ef4444';
  } else {
    qMonsterBadge.textContent = '🐉';
    qTitle.textContent = 'ตอบคำถามเพื่อรับคะแนน!';
    qTitle.style.color = '';
  }
  
  qMonsterInfo.textContent = `กำจัด ${data.monsterName} (รางวัล: ${data.xp} คะแนน)`;
  qText.textContent = data.question;
  
  qChoices.innerHTML = '';
  data.choices.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<div class="choice-label">${String.fromCharCode(65 + index)}</div> <span>${choice}</span>`;
    btn.onclick = () => submitAnswer(index, btn);
    qChoices.appendChild(btn);
  });
});

function submitAnswer(index, btnElement) {
  // Disable all buttons
  const btns = qChoices.querySelectorAll('.choice-btn');
  btns.forEach(b => b.classList.add('disabled'));
  
  socket.emit('answerQuestion', { answer: index });
  
  socket.once('answerResult', (result) => {
    qResult.classList.remove('hidden');
    qResult.className = `question-result ${result.correct ? 'correct-result' : 'wrong-result'}`;
    
    if (result.correct) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('correct');
      btnElement.classList.add('correct');
      qResult.innerHTML = `<strong>✅ ถูกต้อง!</strong> รับไปเลย ${result.points} คะแนน<br><small>${result.explanation}</small>`;
    } else {
      if (typeof AudioManager !== 'undefined') AudioManager.playSFX('wrong');
      btnElement.classList.add('wrong');
      btns[result.correctAnswer].classList.add('correct');
      qResult.innerHTML = `<strong>❌ ผิด!</strong> ไม่ได้รับคะแนน<br><small>${result.explanation}</small>`;
    }
    
    setTimeout(() => {
      qModal.classList.add('hidden');
    }, 4000);
  });
}

// ─── Game Over ───
socket.on('gameEnded', (data) => {
  if (typeof AudioManager !== 'undefined') {
    AudioManager.playBGM('lobby');
    AudioManager.playSFX('gameover');
  }
  goModal.classList.remove('hidden');
  youDiedModal.classList.add('hidden');
  qModal.classList.add('hidden');
  
  rankingsList.innerHTML = '';
  data.rankings.forEach((rank, i) => {
    const entry = document.createElement('div');
    entry.className = 'rank-entry';
    entry.innerHTML = `
      <div class="rank-pos">#${i + 1}</div>
      <div class="rank-color" style="background-color: ${rank.color}"></div>
      <div class="rank-name">${rank.name} <div class="rank-details">ตอบถูก ${rank.correctAnswers} ข้อ | กำจัด ${rank.monstersKilled} มอนสเตอร์</div></div>
      <div class="rank-score">${rank.score}</div>
    `;
    rankingsList.appendChild(entry);
  });
});

playAgainBtn.addEventListener('click', () => {
  goModal.classList.add('hidden');
  youDiedModal.classList.add('hidden');
  screens.game.classList.remove('active');
  screens.lobby.classList.add('active');
  document.getElementById('lobbyStatus').textContent = 'รอผู้กล้าท่านอื่นเตรียมพร้อม...';
  readyBtn.disabled = false;
  readyBtn.textContent = '✅ เตรียมพร้อม';
});

leaveLobbyBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');
  screens.lobby.classList.remove('active');
  screens.login.classList.add('active');
});

readyBtn.addEventListener('click', () => {
  socket.emit('playerReady');
  readyBtn.disabled = true;
  readyBtn.textContent = '⏳ รอคนอื่น...';
});

leaveDeathBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');
  youDiedModal.classList.add('hidden');
  screens.game.classList.remove('active');
  screens.login.classList.add('active');
});

spectateBtn.addEventListener('click', () => {
  youDiedModal.classList.add('hidden');
  // Player is already dead (gameState.isDead is true, so they can't move/attack)
  // They just watch until the game finishes.
});

// ─── Game Logic ───
function attemptAttack() {
  if (typeof AudioManager !== 'undefined') AudioManager.playSFX('attack');
  const me = gameState.players[gameState.myId];
  if (!me || me.isDead) return;
  
  // Find nearest monster
  let closest = null;
  let minDist = Infinity;
  
  for (const id in gameState.monsters) {
    const m = gameState.monsters[id];
    const dx = m.x - me.x;
    const dy = m.y - me.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 60 + m.size && dist < minDist) {
      minDist = dist;
      closest = m;
    }
  }
  
  if (closest) {
    socket.emit('attackMonster', { monsterId: closest.id });
  }
}

function updateLeaderboard() {
  const sorted = Object.values(gameState.players).sort((a, b) => b.score - a.score);
  leaderboardList.innerHTML = '';
  
  let myRankIndex = -1;
  sorted.forEach((p, i) => {
    if (p.id === gameState.myId) myRankIndex = i;
  });

  const createEntry = (p, rank) => {
    const el = document.createElement('div');
    el.className = 'lb-entry';
    el.innerHTML = `
      <div class="lb-rank">#${rank}</div>
      <div class="lb-dot" style="background-color: ${p.color}"></div>
      <div class="lb-name">${p.name} ${p.id === gameState.myId ? '(คุณ)' : ''}</div>
      <div class="lb-score">${p.score}</div>
    `;
    return el;
  };

  const topPlayers = sorted.slice(0, 3);
  topPlayers.forEach((p, i) => {
    leaderboardList.appendChild(createEntry(p, i + 1));
  });

  if (myRankIndex >= 3) {
    const dots = document.createElement('div');
    dots.style.textAlign = 'center';
    dots.style.color = 'var(--gold)';
    dots.style.fontSize = '12px';
    dots.style.margin = '2px 0';
    dots.textContent = '...';
    leaderboardList.appendChild(dots);
    
    leaderboardList.appendChild(createEntry(sorted[myRankIndex], myRankIndex + 1));
  }
}

function updateMovement(dt) {
  const me = gameState.players[gameState.myId];
  if (!me || me.isDead) return;
  
  let dx = 0;
  let dy = 0;
  let dir = me.direction;
  
  if (keys.w || keys.ArrowUp) { dy -= 1; dir = 'up'; }
  if (keys.s || keys.ArrowDown) { dy += 1; dir = 'down'; }
  if (keys.a || keys.ArrowLeft) { dx -= 1; dir = 'left'; }
  if (keys.d || keys.ArrowRight) { dx += 1; dir = 'right'; }
  
  if (dx !== 0 || dy !== 0) {
    // Normalize
    const len = Math.sqrt(dx*dx + dy*dy);
    const cappedDt = Math.min(dt, 0.1); // prevent huge jumps if tab is backgrounded
    const PLAYER_SPEED = 180;
    
    dx = (dx/len) * PLAYER_SPEED * cappedDt;
    dy = (dy/len) * PLAYER_SPEED * cappedDt;
    
    me.x = Math.max(20, Math.min(gameState.mapWidth - 20, me.x + dx));
    me.y = Math.max(20, Math.min(gameState.mapHeight - 20, me.y + dy));
    me.direction = dir;
    
    const now = Date.now();
    if (now - lastMoveEmitTime > 66) { // ~15 FPS max network emit rate
      socket.emit('playerMove', { x: me.x, y: me.y, direction: dir });
      lastMoveEmitTime = now;
    }
  }
}

function updateCamera() {
  const me = gameState.players[gameState.myId];
  if (!me) return;
  
  gameState.camera.x = me.x - gameState.camera.width / 2;
  gameState.camera.y = me.y - gameState.camera.height / 2;
  
  // Clamp camera
  gameState.camera.x = Math.max(0, Math.min(gameState.mapWidth - gameState.camera.width, gameState.camera.x));
  gameState.camera.y = Math.max(0, Math.min(gameState.mapHeight - gameState.camera.height, gameState.camera.y));
}

// ─── Rendering ───
function drawBattlefield() {
  const cx = gameState.camera.x;
  const cy = gameState.camera.y;
  const w = canvas.width;
  const h = canvas.height;
  const mapW = gameState.mapWidth;
  const mapH = gameState.mapHeight;

  // 1. Draw repeating checkered grass base
  const tileSize = 80;
  const startX = Math.floor(cx / tileSize) * tileSize;
  const startY = Math.floor(cy / tileSize) * tileSize;

  for (let x = startX - tileSize; x < cx + w + tileSize; x += tileSize) {
    for (let y = startY - tileSize; y < cy + h + tileSize; y += tileSize) {
      const isDark = ((Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2) === 0;
      ctx.fillStyle = isDark ? '#2e4c19' : '#35561d';
      ctx.fillRect(x - cx, y - cy, tileSize, tileSize);
      
      const pseudo = Math.abs(Math.sin(x * 12.9898 + y * 78.233)) * 43758.5453;
      if (pseudo % 1 > 0.8) {
        ctx.fillStyle = '#4a732a';
        ctx.fillRect(x - cx + 20, y - cy + 20, 6, 16);
        ctx.fillRect(x - cx + 32, y - cy + 28, 6, 12);
      }
    }
  }

  // 2. Draw a giant Castle Boss Courtyard in the center
  const cxCenter = mapW / 2;
  const cyCenter = mapH / 2;
  const courtyardSize = 800;
  
  const crtX = cxCenter - courtyardSize/2;
  const crtY = cyCenter - courtyardSize/2;
  
  // Only draw if visible in camera
  if (crtX + courtyardSize > cx && crtX < cx + w && crtY + courtyardSize > cy && crtY < cy + h) {
    // Stone floor Base
    ctx.fillStyle = '#57534e';
    ctx.fillRect(crtX - cx, crtY - cy, courtyardSize, courtyardSize);
    
    // Stone grid lines
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= courtyardSize; i += 100) {
      ctx.moveTo(crtX + i - cx, crtY - cy);
      ctx.lineTo(crtX + i - cx, crtY + courtyardSize - cy);
      ctx.moveTo(crtX - cx, crtY + i - cy);
      ctx.lineTo(crtX + courtyardSize - cx, crtY + i - cy);
    }
    ctx.stroke();
    
    // Golden castle border
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 12;
    ctx.strokeRect(crtX - cx, crtY - cy, courtyardSize, courtyardSize);
    
    // Royal Red Carpet
    const carpetWidth = 200;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(cxCenter - carpetWidth/2 - cx, crtY - cy, carpetWidth, courtyardSize);
    // Carpet gold borders
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cxCenter - carpetWidth/2 - cx, crtY - cy, 15, courtyardSize);
    ctx.fillRect(cxCenter + carpetWidth/2 - 15 - cx, crtY - cy, 15, courtyardSize);
    
    // Center boss spawn magic circle
    ctx.beginPath();
    ctx.arc(cxCenter - cx, cyCenter - cy, 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 8;
    ctx.setLineDash([20, 20]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Magic Runes (Squares)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cxCenter - cx - 10, cyCenter - cy - 150 - 10, 20, 20);
    ctx.fillRect(cxCenter - cx - 10, cyCenter - cy + 150 - 10, 20, 20);
    ctx.fillRect(cxCenter - cx - 150 - 10, cyCenter - cy - 10, 20, 20);
    ctx.fillRect(cxCenter - cx + 150 - 10, cyCenter - cy - 10, 20, 20);
  }

  // 3. Map boundaries (dark forest/wall)
  ctx.strokeStyle = '#1a1412';
  ctx.lineWidth = 40;
  ctx.strokeRect(-cx, -cy, mapW, mapH);
}

const CLASS_ICONS = {
  '#f472b6': '🧙‍♀️', '#60a5fa': '🗡️', '#4ade80': '🏹', '#facc15': '🛡️',
  '#c084fc': '🔮', '#fb923c': '⚔️', '#2dd4bf': '🪓', '#f87171': '🔥'
};

function drawPlayer(player) {
  const px = player.x - gameState.camera.x;
  const py = player.y - gameState.camera.y;
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px, py + 15, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw High-Res SVG Sprite
  const spriteType = player.spriteType || ((player.color === '#f472b6' || player.color === '#c084fc') ? 'mage' : 'knight');
  const scale = 3; 
  
  if (player.isDead) {
    ctx.globalAlpha = 0.5; // Make ghost-like
    renderPlayerSprite(ctx, { ...player, color: '#9e9e9e', spriteType }, px, py, scale); // Gray color
    ctx.globalAlpha = 1.0;
  } else {
    renderPlayerSprite(ctx, { ...player, spriteType }, px, py, scale);
  }
  
  // Name tag
  ctx.fillStyle = 'rgba(62, 39, 35, 0.8)';
  ctx.beginPath();
  ctx.roundRect(px - 30, py - 42, 60, 18, 4);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = '#f4e8c1';
  ctx.font = 'bold 12px "Mali"';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, px, py - 32);
  
  // Attacking effect
  if (player.isAttacking && !player.isDead) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 35, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw HP bar
  if (!player.isDead) {
    const hpPct = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px - 16, py - 48, 32, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : hpPct > 0.2 ? '#facc15' : '#ef4444';
    ctx.fillRect(px - 15, py - 47, 30 * hpPct, 4);
  }
}

const MONSTER_SPRITE_MAP = {
  'สไลม์': 'slime',
  'ค้างคาว': 'bat',
  'หมาป่า': 'wolf',
  'โกเลม': 'golem',
  'มังกรน้อย': 'dragon',
  '⚡ จอมมารแห่งความรู้ ⚡': 'boss'
};

const bossImg = new Image();
bossImg.src = 'boss.png';

function drawMonster(monster) {
  const mx = monster.x - gameState.camera.x;
  const my = monster.y - gameState.camera.y;
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(mx, my + monster.size/2, monster.size/1.5, monster.size/3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw Boss or Pixel Art Sprite
  let bob = Math.sin(Date.now() / 200 + monster.id.charCodeAt(0)) * 5;
  
  if (monster.isLastBoss && bossImg.complete) {
    const imgW = 140;
    const imgH = 200;
    ctx.drawImage(bossImg, mx - imgW/2, my + monster.size/2 - imgH + bob, imgW, imgH);
  } else {
    const spriteType = MONSTER_SPRITE_MAP[monster.name] || 'slime';
    const scale = monster.isLastBoss ? 6 : (monster.size / 10);
    renderSprite(ctx, spriteType, mx, my + bob, scale, monster.color, 'down');
  }
  
  // Medieval HP Bar
  const hpPct = Math.max(0, monster.currentHp / monster.hp);
  const barWidth = 50;
  
  ctx.fillStyle = '#b8860b'; // Gold border
  ctx.fillRect(mx - barWidth/2 - 2, my - monster.size/2 - 22, barWidth + 4, 10);
  
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(mx - barWidth/2, my - monster.size/2 - 20, barWidth, 6);
  
  ctx.fillStyle = hpPct > 0.5 ? '#2e7d32' : hpPct > 0.2 ? '#f57f17' : '#c62828';
  ctx.fillRect(mx - barWidth/2, my - monster.size/2 - 20, barWidth * hpPct, 6);
  
  // Name
  ctx.font = 'bold 14px "Mali"';
  ctx.textAlign = 'center';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'black';
  ctx.strokeText(monster.name, mx, my - monster.size/2 - 32);
  ctx.fillStyle = monster.color;
  ctx.fillText(monster.name, mx, my - monster.size/2 - 32);
}

function updateAndDrawParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.life--;
    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
      continue;
    }
    
    p.x += p.vx;
    p.y += p.vy;
    
    const px = p.x - gameState.camera.x;
    const py = p.y - gameState.camera.y;
    
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function updateAndDrawFloatingTexts() {
  for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
    const t = gameState.floatingTexts[i];
    t.life--;
    if (t.life <= 0) {
      gameState.floatingTexts.splice(i, 1);
      continue;
    }
    
    t.y -= 1;
    
    const px = t.x - gameState.camera.x;
    const py = t.y - gameState.camera.y;
    
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 20px "Outfit"';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, px, py);
    ctx.globalAlpha = 1;
  }
}

function drawMinimap() {
  minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  
  const scaleX = minimapCanvas.width / gameState.mapWidth;
  const scaleY = minimapCanvas.height / gameState.mapHeight;
  
  // Viewport rect
  minimapCtx.fillStyle = 'rgba(255,255,255,0.1)';
  minimapCtx.fillRect(
    gameState.camera.x * scaleX,
    gameState.camera.y * scaleY,
    gameState.camera.width * scaleX,
    gameState.camera.height * scaleY
  );
  minimapCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  minimapCtx.strokeRect(
    gameState.camera.x * scaleX,
    gameState.camera.y * scaleY,
    gameState.camera.width * scaleX,
    gameState.camera.height * scaleY
  );
  
  // Monsters
  for (const id in gameState.monsters) {
    const m = gameState.monsters[id];
    minimapCtx.fillStyle = m.isLastBoss ? '#ef4444' : '#f59e0b';
    minimapCtx.beginPath();
    minimapCtx.arc(m.x * scaleX, m.y * scaleY, m.isLastBoss ? 4 : 2, 0, Math.PI * 2);
    minimapCtx.fill();
  }
  
  // Players
  for (const id in gameState.players) {
    const p = gameState.players[id];
    minimapCtx.fillStyle = p.color;
    minimapCtx.beginPath();
    minimapCtx.arc(p.x * scaleX, p.y * scaleY, id === gameState.myId ? 4 : 2, 0, Math.PI * 2);
    minimapCtx.fill();
    
    if (id === gameState.myId) {
      minimapCtx.strokeStyle = 'white';
      minimapCtx.lineWidth = 1;
      minimapCtx.stroke();
    }
  }
}

// ─── Effects ───
function createSpawnEffect(x, y, color, isBoss = false) {
  const count = isBoss ? 50 : 20;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (isBoss ? 5 : 3);
    gameState.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: Math.random() * 4 + 2,
      color: color
    });
  }
}

function createAttackEffect(x, y, dir) {
  for (let i = 0; i < 5; i++) {
    let vx = (Math.random() - 0.5) * 2;
    let vy = (Math.random() - 0.5) * 2;
    if (dir === 'up') vy = -Math.random() * 5;
    if (dir === 'down') vy = Math.random() * 5;
    if (dir === 'left') vx = -Math.random() * 5;
    if (dir === 'right') vx = Math.random() * 5;
    
    gameState.particles.push({
      x, y, vx, vy,
      life: 15, maxLife: 15,
      size: 3, color: 'white'
    });
  }
}

function createDeathEffect(x, y, color) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1;
    gameState.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      size: Math.random() * 5 + 1,
      color: color
    });
  }
}

function createDamageText(x, y, amount) {
  gameState.floatingTexts.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 20,
    text: `-${amount}`,
    color: '#ef4444',
    life: 40,
    maxLife: 40
  });
}

let lastFrameTime = 0;

// ─── Main Loop ───
function gameLoop(timestamp) {
  if (!gameState.active) {
    lastFrameTime = 0;
    return;
  }
  
  if (!lastFrameTime) lastFrameTime = timestamp;
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  
  if (!gameState.isPaused) {
    updateMovement(dt);
    updateCamera();
  }
  
  // Clear canvas and draw battlefield
  drawBattlefield();
  
  // Draw sortable entities (y-axis sorting)
  const entities = [
    ...Object.values(gameState.players).map(p => ({...p, type: 'player'})),
    ...Object.values(gameState.monsters).map(m => ({...m, type: 'monster'}))
  ].sort((a, b) => a.y - b.y);
  
  for (const ent of entities) {
    if (ent.type === 'player') drawPlayer(ent);
    else if (ent.type === 'monster') drawMonster(ent);
  }
  
  if (!gameState.isPaused) {
    // Only update particle logic if not paused
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const p = gameState.particles[i];
      p.life--;
      if (p.life <= 0) { gameState.particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
    }
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
      const t = gameState.floatingTexts[i];
      t.life--;
      if (t.life <= 0) { gameState.floatingTexts.splice(i, 1); continue; }
      t.y -= 1;
    }
  }

  // Draw particles and floating texts statically if paused
  gameState.particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - gameState.camera.x, p.y - gameState.camera.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  gameState.floatingTexts.forEach(t => {
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = 'bold 20px "Outfit"';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x - gameState.camera.x, t.y - gameState.camera.y);
    ctx.globalAlpha = 1;
  });
  
  drawMinimap();
  
  if (gameState.isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px var(--font-th)';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('⏸️ เกมถูกพักชั่วคราว', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
  }
  
  requestAnimationFrame(gameLoop);
}

// CSS Shake animation dynamically added
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}
`;
document.head.appendChild(style);

// Start lobby music on load and attach UI click sounds
if (typeof AudioManager !== 'undefined') {
  AudioManager.playBGM('lobby');
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      AudioManager.playSFX('click');
    }
  });
}
