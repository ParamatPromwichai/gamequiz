const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3000"; 
// const SERVER_URL = "https://gamekubol.onrender.com"; 
const NUM_BOTS = 5;
const TARGET_ROOM_CODE = "76PF"; // <--- เปลี่ยนเป็นเลขห้องที่คุณสร้างไว้ (ตัวพิมพ์ใหญ่)

const bots = [];
let questionBank = {};

// โหลดคำถามจาก API ก่อนเพื่อให้บอทตอบคำถามได้แบบฉลาดๆ
async function initBots() {
    console.log("กำลังโหลดข้อมูลคำถามให้บอท...");
    try {
        const res = await fetch(SERVER_URL + '/api/questions', {
            headers: { 'x-admin-password': '1234' }
        });
        const data = await res.json();
        data.forEach(q => {
            questionBank[q.question] = q.correctAnswer;
        });
        console.log(`โหลดคำถามสำเร็จ ${data.length} ข้อ บอทพร้อมรบ!`);
    } catch (err) {
        console.log("โหลดคำถามไม่สำเร็จ บอทจะเดาสุ่มเอา (Error:", err.message, ")");
    }

    console.log(`กำลังส่งบอท ${NUM_BOTS} ตัว ไปยังห้อง ${TARGET_ROOM_CODE} ...`);

    for (let i = 0; i < NUM_BOTS; i++) {
        setTimeout(() => {
            const bot = io(SERVER_URL);
            bots.push(bot);
            
            bot.on('connect', () => {
                bot.emit('joinRoom', { code: TARGET_ROOM_CODE, name: `Bot_${i+1}` });
            });

            bot.on('joinedLobby', () => {
                console.log(`[Bot ${i+1}] เข้าห้อง ${TARGET_ROOM_CODE} สำเร็จแล้ว และกำลังกด Ready`);
                bot.emit('playerReady');
            });

            bot.on('errorMsg', (msg) => {
                console.log(`[Bot ${i+1}] Error: ${msg}`);
            });

            setupBotLogic(bot, i+1);
        }, i * 100); // ดีเลย์การเกิดทีละ 100ms ป้องกันการยิงรัวเกินไป
    }
}

initBots();

function setupBotLogic(socket, index) {
    let x = 100;
    let y = 100;
    let mapW = 2000;
    let mapH = 2000;
    let gameLoop;
    let monsters = {};
    let myTargetId = null; // เป้าหมายส่วนตัวของบอทตัวนี้

    socket.on('gameStarted', (data) => {
        console.log(`[Bot ${index}] Game started! เริ่มออกล่ามอนสเตอร์แบบกระจายตัว!`);
        monsters = data.monsters;
        if (data.mapWidth) mapW = data.mapWidth;
        if (data.mapHeight) mapH = data.mapHeight;

        x = Math.random() * mapW;
        y = Math.random() * mapH;

        gameLoop = setInterval(() => {
            const monsterIds = Object.keys(monsters);
            
            // เช็กว่ามีบอสเกิดไหม (บอสจะไอดี boss_final หรือมี isLastBoss)
            let bossId = null;
            for (const id of monsterIds) {
                if (id === 'boss_final' || monsters[id].isLastBoss) {
                    bossId = id;
                    break;
                }
            }

            if (bossId) {
                // ถ้ามีบอส บอททุกตัวจะทิ้งเป้าหมายเดิม แล้ววิ่งไปรุมบอส!
                myTargetId = bossId;
            } else if (!myTargetId || !monsters[myTargetId]) {
                // ถ้าไม่มีบอส และเป้าหมายเดิมตายไปแล้ว ให้สุ่มมอนสเตอร์ตัวใหม่กระจายๆ กันไป
                if (monsterIds.length > 0) {
                    myTargetId = monsterIds[Math.floor(Math.random() * monsterIds.length)];
                } else {
                    myTargetId = null;
                }
            }

            if (myTargetId && monsters[myTargetId]) {
                const targetMonster = monsters[myTargetId];
                const dx = targetMonster.x - x;
                const dy = targetMonster.y - y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // ถ้ายังอยู่ไกล ให้เดินเข้าไปหา
                if (dist > 55) { // ระยะโจมตีของเกมคือ 60
                    x += (dx / dist) * 35; // เดินทีละ 35 pixel
                    y += (dy / dist) * 35;
                } else {
                    // ถ้าถึงระยะแล้ว ให้โจมตีตัวนั้น!
                    socket.emit('attackMonster', { monsterId: targetMonster.id });
                }
                
                // หาทิศทางหันหน้า
                let direction = 'down';
                if (Math.abs(dx) > Math.abs(dy)) {
                    direction = dx > 0 ? 'right' : 'left';
                } else {
                    direction = dy > 0 ? 'down' : 'up';
                }
                
                socket.emit('playerMove', { x, y, direction });
            } else {
                // ถ้าไม่มีมอนสเตอร์บนจอ ให้เดินสุ่มๆ ไปก่อน
                x += (Math.random() - 0.5) * 30;
                y += (Math.random() - 0.5) * 30;
                socket.emit('playerMove', { x, y, direction: 'down' });
            }

        }, 200); // ประมวลผลทุกๆ 200ms
    });

    socket.on('monsterSpawned', (monster) => {
        monsters[monster.id] = monster;
    });

    socket.on('lastBossSpawned', (boss) => {
        monsters[boss.id] = boss;
    });

    socket.on('monsterDefeated', (data) => {
        delete monsters[data.monsterId];
    });

    socket.on('showQuestion', (data) => {
        // ดีเลย์ตอบคำถามเพื่อจำลองเวลาอ่านโจทย์ (0.8 ถึง 1.8 วินาที)
        setTimeout(() => {
            let answer = Math.floor(Math.random() * 4);
            
            // มีโอกาส 80% ที่จะตอบถูก (ดึงคำตอบจาก questionBank)
            if (questionBank[data.question] !== undefined && Math.random() < 0.8) {
                answer = questionBank[data.question];
            }
            
            socket.emit('answerQuestion', { answer: answer });
        }, 800 + Math.random() * 1000); 
    });

    socket.on('gameEnded', () => {
        console.log(`[Bot ${index}] Game Ended!`);
        clearInterval(gameLoop);
    });

    socket.on('disconnect', () => {
        clearInterval(gameLoop);
    });
}
