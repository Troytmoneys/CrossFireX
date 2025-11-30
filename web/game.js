const partyList = document.getElementById('partyList');
const friendList = document.getElementById('friendList');
const inventoryGrid = document.getElementById('inventoryGrid');
const menu = document.getElementById('menu');
const gameSection = document.getElementById('game');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const logBox = document.getElementById('eventLog');

let gameLoopHandle;
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
const keys = new Set();

const partyMembers = [
  { name: 'LuxRay', role: 'Leader', status: 'Ready', color: '#4df3c9' },
  { name: 'MintNova', role: 'Flanker', status: 'Selecting Loadout', color: '#f7c948' },
  { name: 'Kyoto', role: 'Sharpshooter', status: 'In Range', color: '#30c1ff' },
  { name: 'Open Slot', role: 'Invite Friends', status: 'Open', color: '#5b6170' },
];

const friends = [
  { name: 'VectorFox', status: 'online', activity: 'In Lobby' },
  { name: 'ZeroDrop', status: 'ingame', activity: 'Arena: Neon Run' },
  { name: 'Sable', status: 'offline', activity: 'Last seen 1h ago' },
  { name: 'Karma', status: 'online', activity: 'Party Leader' },
  { name: 'Rift', status: 'ingame', activity: 'Payload' },
];

const inventoryItems = [
  { title: 'Pulse Rifle', rarity: 'Rare', type: 'Primary', color: '#4df3c9' },
  { title: 'Kinetic SMG', rarity: 'Legendary', type: 'Primary', color: '#f7c948' },
  { title: 'Evo Shotgun', rarity: 'Epic', type: 'Primary', color: '#ff5a81' },
  { title: 'Winged Revolver', rarity: 'Rare', type: 'Sidearm', color: '#30c1ff' },
  { title: 'Blink Dash', rarity: 'Ability', type: 'Ability', color: '#9a6bff' },
  { title: 'Sensor Dart', rarity: 'Ability', type: 'Ability', color: '#45e0c1' },
  { title: 'Void Runner', rarity: 'Skin', type: 'Cosmetic', color: '#f7c948' },
  { title: 'Solar Flare', rarity: 'Skin', type: 'Cosmetic', color: '#ff5a81' },
];

const gameState = {
  running: false,
  player: { x: canvas.width / 2, y: canvas.height / 2, hp: 100, shield: 50, speed: 3.4, ammo: 30, reserve: 120, streak: 0 },
  bullets: [],
  enemies: [],
  lastSpawn: 0,
};

function renderParty() {
  partyList.innerHTML = '';
  partyMembers.forEach((member) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${member.name}</strong>
        <div class="meta">${member.role}</div>
      </div>
      <div class="tag ${member.status === 'Ready' ? 'online' : member.status === 'Open' ? 'offline' : 'ingame'}">${member.status}</div>
    `;
    partyList.appendChild(li);
  });
}

function renderFriends() {
  friendList.innerHTML = '';
  friends.forEach((friend) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${friend.name}</strong>
        <div class="meta">${friend.activity}</div>
      </div>
      <div class="tag ${friend.status}">${friend.status}</div>
    `;
    friendList.appendChild(li);
  });
}

function renderInventory() {
  inventoryGrid.innerHTML = '';
  inventoryItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'inventory-item';
    card.style.borderColor = `${item.color}44`;
    card.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="rarity">${item.type}</div>
      <div class="tag online" style="background:${item.color}22;color:${item.color}">${item.rarity}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.inventory-item').forEach((el) => el.classList.remove('active'));
      card.classList.add('active');
      logEvent(`Equipped ${item.title}`);
      document.getElementById('weapon').textContent = item.title;
    });
    inventoryGrid.appendChild(card);
  });
}

function logEvent(message) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  logBox.textContent = `[${time}] ${message}`;
}

function startGame() {
  menu.classList.add('hidden');
  gameSection.classList.remove('hidden');
  canvas.requestPointerLock?.();
  gameState.running = true;
  gameState.player.x = canvas.width / 2;
  gameState.player.y = canvas.height / 2;
  gameState.bullets = [];
  gameState.enemies = [];
  gameState.lastSpawn = performance.now();
  spawnEnemy();
  loop();
}

function leaveGame() {
  document.exitPointerLock?.();
  gameState.running = false;
  cancelAnimationFrame(gameLoopHandle);
  menu.classList.remove('hidden');
  gameSection.classList.add('hidden');
}

function loop(timestamp = 0) {
  if (!gameState.running) return;
  update(timestamp);
  draw();
  gameLoopHandle = requestAnimationFrame(loop);
}

function update(timestamp) {
  const player = gameState.player;
  const speed = keys.has('Shift') ? player.speed * 1.25 : player.speed;
  if (keys.has('w') || keys.has('ArrowUp')) player.y -= speed;
  if (keys.has('s') || keys.has('ArrowDown')) player.y += speed;
  if (keys.has('a') || keys.has('ArrowLeft')) player.x -= speed;
  if (keys.has('d') || keys.has('ArrowRight')) player.x += speed;

  player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
  player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

  gameState.bullets.forEach((b) => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
    b.life -= 1;
  });
  gameState.bullets = gameState.bullets.filter((b) => b.life > 0 && b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

  gameState.enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;
  });

  for (const bullet of gameState.bullets) {
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist < 16) {
        enemy.hp -= 40;
        bullet.life = 0;
        logEvent('Tagged enemy');
      }
    }
  }

  gameState.enemies = gameState.enemies.filter((enemy) => {
    if (enemy.hp <= 0) {
      gameState.player.streak += 1;
      document.getElementById('streak').textContent = gameState.player.streak;
      logEvent('Eliminated an enemy');
      return false;
    }
    return true;
  });

  if (timestamp - gameState.lastSpawn > 2000) {
    spawnEnemy();
    gameState.lastSpawn = timestamp;
  }

  document.getElementById('hp').textContent = player.hp;
  document.getElementById('shield').textContent = player.shield;
  document.getElementById('ammo').textContent = `${player.ammo} / ${player.reserve}`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  ctx.fillStyle = '#202736';
  ctx.fillRect(160, 140, 240, 120);
  ctx.fillRect(620, 420, 300, 120);

  ctx.strokeStyle = 'rgba(77, 243, 201, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  gameState.enemies.forEach((enemy) => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = enemy.color;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const player = gameState.player;
  ctx.save();
  ctx.translate(player.x, player.y);
  const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  ctx.rotate(angle);
  ctx.fillStyle = '#4df3c9';
  ctx.shadowColor = '#4df3c9';
  ctx.shadowBlur = 12;
  ctx.fillRect(-10, -10, 20, 20);
  ctx.fillStyle = '#1b202c';
  ctx.fillRect(10, -4, 18, 8);
  ctx.restore();

  ctx.strokeStyle = 'rgba(77, 243, 201, 0.65)';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mousePos.x, mousePos.y);
  ctx.stroke();

  gameState.bullets.forEach((b) => {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  const margin = 30;
  const enemy = {
    x: edge === 0 ? margin : edge === 1 ? canvas.width - margin : Math.random() * canvas.width,
    y: edge === 2 ? margin : edge === 3 ? canvas.height - margin : Math.random() * canvas.height,
    speed: 1.2 + Math.random() * 0.8,
    hp: 80,
    color: '#ff5a81',
  };
  gameState.enemies.push(enemy);
}

function shoot() {
  const player = gameState.player;
  if (player.ammo <= 0) {
    logEvent('Out of ammo — reload!');
    return;
  }
  player.ammo -= 1;
  const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  gameState.bullets.push({ x: player.x, y: player.y, angle, speed: 9, life: 60 });
  logEvent('Fired Pulse Rifle');
}

function reload() {
  const player = gameState.player;
  if (player.reserve <= 0 || player.ammo === 30) return;
  const needed = 30 - player.ammo;
  const used = Math.min(needed, player.reserve);
  player.reserve -= used;
  player.ammo += used;
  logEvent('Reloading');
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
});

document.addEventListener('keydown', (e) => {
  keys.add(e.key);
  if (e.code === 'Space') {
    gameState.player.x += Math.cos(Math.atan2(mousePos.y - gameState.player.y, mousePos.x - gameState.player.x)) * 18;
    gameState.player.y += Math.sin(Math.atan2(mousePos.y - gameState.player.y, mousePos.x - gameState.player.x)) * 18;
    logEvent('Dash engaged');
  }
  if (e.code === 'KeyR') reload();
});

document.addEventListener('keyup', (e) => keys.delete(e.key));
canvas.addEventListener('click', shoot);

document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnLeave').addEventListener('click', leaveGame);
document.getElementById('btnQueue').addEventListener('click', () => logEvent('Queueing for Quick Play...'));
document.getElementById('btnPrivate').addEventListener('click', () => logEvent('Private lobby created.'));
document.getElementById('btnAddFriend').addEventListener('click', () => logEvent('Friend request sent.'));
document.getElementById('btnRecent').addEventListener('click', () => logEvent('Loaded recent players.'));
document.getElementById('btnTraining').addEventListener('click', () => logEvent('Training mode booted.'));
document.getElementById('btnCustomize').addEventListener('click', () => logEvent('Customizer opened.'));
document.getElementById('btnPatchNotes').addEventListener('click', () => logEvent('v0.1: Movement polish, updated HUD.'));
document.getElementById('btnSettings').addEventListener('click', () => logEvent('Settings modal (placeholder).'));
document.getElementById('btnSignIn').addEventListener('click', () => logEvent('Signing into CrossFireX account...'));
document.getElementById('btnShuffleLoadout').addEventListener('click', () => logEvent('Adaptive Loadout shuffled.'));
document.getElementById('btnEquip').addEventListener('click', () => logEvent('Equipped selected item.'));
document.getElementById('btnInspect').addEventListener('click', () => logEvent('Inspecting cosmetic.'));

renderParty();
renderFriends();
renderInventory();
logEvent('Ready up and join the party podium.');
