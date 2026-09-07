// Fonrox Standalone Web Arcade - Script Engine
let currentServerId = 'server-1';
let currentServerName = 'Public Server #1';
let activeGame = null;
let activeChatTab = 'server';
let leaveStep = 'idle'; // 'idle' | 'asked_leave' | 'asked_sure'
let balance = 1000;
let isOwner = true;

// Server Chat & Global Chat data stores
let serverChats = {
  'server-1': [
    { author: 'CyberPlayer', text: 'Welcome to Server 1!' },
    { author: 'NeonRider', text: 'Anyone want to play Pong?' }
  ],
  'server-vip': [
    { author: 'DevNamedFoNRox', text: 'Welcome to the VIP Owner Sanctuary.' }
  ]
};

let globalChat = [
  { author: 'GlobalMod', text: 'Welcome to FoNRox Global Arena!' },
  { author: 'StarShooter', text: 'Laser Dash is super fun today!' }
];

// Open Game
function openGame(gameKey) {
  activeGame = gameKey;
  leaveStep = 'idle';
  updateLeaveButton();
  document.getElementById('gameModal').style.display = 'flex';
  document.getElementById('activeGameTitle').innerText = getGameTitle(gameKey);
  
  // Refresh chat on server game join
  refreshChat();
  startGameCanvas(gameKey);
}

function getGameTitle(key) {
  switch (key) {
    case 'laser-dash': return 'Laser Dash Cyber Runner';
    case 'cyber-pong': return 'Neon Cyber Pong';
    case 'neon-snake': return 'Neon Cyber Snake';
    case 'tic-tac-toe': return 'Tic-Tac-Toe Cyber Arena';
    default: return 'Mini-Game';
  }
}

// Exit Game
function exitGame() {
  activeGame = null;
  leaveStep = 'idle';
  document.getElementById('gameModal').style.display = 'none';
  if (gameInterval) clearInterval(gameInterval);
}

// 2-Step Leave Button Logic
function handleLeaveButtonClick() {
  if (leaveStep === 'idle') {
    leaveStep = 'asked_leave';
  } else if (leaveStep === 'asked_leave') {
    leaveStep = 'asked_sure';
  }
  updateLeaveButton();
}

function cancelLeave() {
  leaveStep = 'idle';
  updateLeaveButton();
}

function updateLeaveButton() {
  const container = document.getElementById('bottomLeaveContainer');
  if (leaveStep === 'idle') {
    container.innerHTML = `
      <button class="leave-step-idle" onclick="handleLeaveButtonClick()">
        <span style="font-weight:900; color:#00f0ff;">◆</span>
        <span>Leave Game</span>
      </button>
    `;
  } else if (leaveStep === 'asked_leave') {
    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="leave-step-asked" onclick="handleLeaveButtonClick()">
          <span>Leave?</span>
        </button>
        <button class="btn-cancel-leave" onclick="cancelLeave()">✕</button>
      </div>
    `;
  } else if (leaveStep === 'asked_sure') {
    container.innerHTML = `
      <div class="leave-step-confirm">
        <span>Are you sure you want to leave?</span>
        <button style="background:#fff; color:#b91c1c; padding:4px 12px; font-weight:900; border-radius:6px;" onclick="exitGame()">Leave</button>
        <button class="btn-cancel-leave" onclick="cancelLeave()">Cancel</button>
      </div>
    `;
  }
}

// Chat System (Server Chat & Global Chat)
function toggleChat() {
  const drawer = document.getElementById('chatDrawer');
  drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
  renderChatMessages();
}

function setChatTab(tab) {
  activeChatTab = tab;
  document.getElementById('tabServer').classList.toggle('active', tab === 'server');
  document.getElementById('tabGlobal').classList.toggle('active', tab === 'global');
  renderChatMessages();
}

function refreshChat() {
  // Refresh chat every time you join a new server
  if (!serverChats[currentServerId]) {
    serverChats[currentServerId] = [];
  }
  serverChats[currentServerId].push({
    author: 'System',
    text: `Joined ${currentServerName}. Chat refreshed.`
  });
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const list = activeChatTab === 'server' ? (serverChats[currentServerId] || []) : globalChat;
  
  container.innerHTML = list.map(m => `
    <div class="chat-bubble">
      <div class="chat-bubble-author">${m.author}</div>
      <div>${m.text}</div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  
  if (activeChatTab === 'server') {
    if (!serverChats[currentServerId]) serverChats[currentServerId] = [];
    serverChats[currentServerId].push({ author: 'You', text });
  } else {
    globalChat.push({ author: 'You', text });
  }
  input.value = '';
  renderChatMessages();
}

// Admin Panel (Easy Mode)
function openAdmin() {
  document.getElementById('adminModal').style.display = 'flex';
}

function closeAdmin() {
  document.getElementById('adminModal').style.display = 'none';
}

function joinVipServer() {
  currentServerId = 'server-vip';
  currentServerName = '👑 VIP Owner Sanctuary';
  document.getElementById('currentServerLabel').innerText = currentServerName;
  refreshChat();
  alert('Joined Exclusive VIP Owner Sanctuary Server! Only you can see and join this server.');
  closeAdmin();
}

function addCurrency(amount) {
  balance += amount;
  document.getElementById('userBalanceDisplay').innerText = balance.toLocaleString() + ' FoNRux';
  alert(`Added +${amount.toLocaleString()} FoNRux!`);
}

function addCustomCurrency() {
  const input = document.getElementById('customCurrencyInput');
  const amt = parseInt(input ? input.value : '0', 10);
  if (!amt || amt <= 0) {
    alert('Please enter a valid positive number for FoNRux!');
    return;
  }
  addCurrency(amt);
}

function triggerWin() {
  alert('Victory Granted! Max points recorded and +100 FoNRux earned!');
  addCurrency(100);
}

// Canvas Game Engine (Snake / Pong)
let gameInterval = null;
function startGameCanvas(gameKey) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if (gameInterval) clearInterval(gameInterval);

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dx = 1, dy = 0;
  let score = 0;

  window.onkeydown = (e) => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
  };

  gameInterval = setInterval(() => {
    ctx.fillStyle = '#080517';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0) head.x = Math.floor(canvas.width / 20) - 1;
    if (head.x >= canvas.width / 20) head.x = 0;
    if (head.y < 0) head.y = Math.floor(canvas.height / 20) - 1;
    if (head.y >= canvas.height / 20) head.y = 0;

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      food = {
        x: Math.floor(Math.random() * (canvas.width / 20)),
        y: Math.floor(Math.random() * (canvas.height / 20))
      };
    } else {
      snake.pop();
    }

    // Draw food
    ctx.fillStyle = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#f59e0b';
    ctx.fillRect(food.x * 20, food.y * 20, 18, 18);

    // Draw snake
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    snake.forEach(part => {
      ctx.fillRect(part.x * 20, part.y * 20, 18, 18);
    });

    // Score
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + score, 15, 25);
  }, 100);
}
