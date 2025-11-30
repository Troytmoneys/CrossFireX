import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const ui = {
  partyList: document.getElementById('partyList'),
  friendList: document.getElementById('friendList'),
  inventoryGrid: document.getElementById('inventoryGrid'),
  menu: document.getElementById('menu'),
  game: document.getElementById('game'),
  canvas: document.getElementById('gameCanvas'),
  log: document.getElementById('eventLog'),
  hp: document.getElementById('hp'),
  shield: document.getElementById('shield'),
  ammo: document.getElementById('ammo'),
  streak: document.getElementById('streak'),
  weapon: document.getElementById('weapon'),
  matchLabel: document.getElementById('matchLabel'),
  netStatus: document.getElementById('netStatus'),
  btnFullscreen: document.getElementById('btnFullscreen'),
  btnCopyLink: document.getElementById('btnCopyLink'),
};

const params = new URLSearchParams(location.search);
const matchId = params.get('match') || `x${Math.random().toString(36).slice(2, 7)}`;

const network = {
  ws: null,
  connected: false,
  playerId: null,
  pendingInputs: [],
  sequence: 0,
  remotePlayers: new Map(),
};

const player = {
  name: 'LuxRay',
  pos: new THREE.Vector3(0, 1.6, 0),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: 0,
  pitch: 0,
  hp: 100,
  shield: 50,
  ammo: 30,
  reserve: 120,
  grounded: true,
};

const inputs = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  slide: false,
  shoot: false,
};

const world = {
  scene: new THREE.Scene(),
  renderer: new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true }),
  camera: new THREE.PerspectiveCamera(75, ui.canvas.width / ui.canvas.height, 0.1, 200),
  clock: new THREE.Clock(),
};

const partyMembers = [
  { name: 'LuxRay', role: 'Leader', status: 'Ready', color: '#4df3c9' },
  { name: 'MintNova', role: 'Flanker', status: 'Ready', color: '#f7c948' },
  { name: 'Kyoto', role: 'Sharpshooter', status: 'In Range', color: '#30c1ff' },
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

function renderParty() {
  ui.partyList.innerHTML = '';
  partyMembers.forEach((member) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${member.name}</strong>
        <div class="meta">${member.role}</div>
      </div>
      <div class="tag ${member.status === 'Ready' ? 'online' : 'ingame'}">${member.status}</div>
    `;
    ui.partyList.appendChild(li);
  });
}

function renderFriends() {
  ui.friendList.innerHTML = '';
  friends.forEach((friend) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${friend.name}</strong>
        <div class="meta">${friend.activity}</div>
      </div>
      <div class="tag ${friend.status}">${friend.status}</div>
    `;
    ui.friendList.appendChild(li);
  });
}

function renderInventory() {
  ui.inventoryGrid.innerHTML = '';
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
      ui.weapon.textContent = item.title;
      logEvent(`Equipped ${item.title}`);
    });
    ui.inventoryGrid.appendChild(card);
  });
}

function logEvent(message) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  ui.log.textContent = `[${time}] ${message}`;
}

function setupScene() {
  world.scene.background = new THREE.Color('#05060b');

  const ambient = new THREE.AmbientLight(0x88ccff, 0.6);
  const dir = new THREE.DirectionalLight(0x88f7ff, 0.6);
  dir.position.set(5, 8, 3);
  world.scene.add(ambient, dir);

  const groundGeo = new THREE.PlaneGeometry(120, 120, 10, 10);
  const groundMat = new THREE.MeshStandardMaterial({ color: '#0f1629', metalness: 0.1, roughness: 0.6 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.scene.add(ground);

  const rampMaterial = new THREE.MeshStandardMaterial({ color: '#1c2f4a' });
  const ramps = [
    { pos: [0, 0, -15], size: [6, 3, 12], rot: [-0.4, 0, 0] },
    { pos: [12, 0, 6], size: [5, 2.5, 10], rot: [-0.25, Math.PI / 2, 0] },
    { pos: [-14, 0, 9], size: [8, 3, 12], rot: [-0.35, -Math.PI / 4, 0] },
  ];
  ramps.forEach(({ pos, size, rot }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), rampMaterial);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    world.scene.add(mesh);
  });

  const pillars = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 10), new THREE.MeshStandardMaterial({ color: '#223a5c' }), 6);
  const dummy = new THREE.Object3D();
  const coords = [
    [-10, 3, -8],
    [10, 3, -10],
    [-16, 3, 12],
    [16, 3, 14],
    [0, 3, 18],
    [0, 3, -20],
  ];
  coords.forEach((c, i) => {
    dummy.position.set(...c);
    dummy.updateMatrix();
    pillars.setMatrixAt(i, dummy.matrix);
  });
  world.scene.add(pillars);

  world.camera.position.set(0, 1.6, 4);
  world.renderer.setSize(ui.canvas.width, ui.canvas.height, false);
  world.renderer.setPixelRatio(window.devicePixelRatio);
}

function requestPointer() {
  ui.canvas.requestPointerLock?.();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function handlePointer(e) {
  if (document.pointerLockElement !== ui.canvas) return;
  const sensitivity = 0.0025;
  player.yaw -= e.movementX * sensitivity;
  player.pitch -= e.movementY * sensitivity;
  player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.pitch));
}

function handleKey(e, down) {
  switch (e.key.toLowerCase()) {
    case 'w':
      inputs.forward = down;
      break;
    case 's':
      inputs.back = down;
      break;
    case 'a':
      inputs.left = down;
      break;
    case 'd':
      inputs.right = down;
      break;
    case ' ': {
      if (down && player.grounded) inputs.jump = true;
      break;
    }
    case 'shift':
      inputs.slide = down;
      break;
  }
}

function sendInput(dt) {
  if (!network.connected) return;
  const payload = {
    type: 'input',
    matchId,
    seq: ++network.sequence,
    dt,
    input: { ...inputs, yaw: player.yaw, pitch: player.pitch },
  };
  network.ws?.send(JSON.stringify(payload));
  network.pendingInputs.push(payload);
}

function applyMovement(state, dt, input) {
  const accel = input.slide ? 20 : 14;
  const maxSpeed = input.slide ? 16 : 11;
  const jumpImpulse = 8;
  const slideBoost = 4;

  const forward = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw) * -1);
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();

  let wish = new THREE.Vector3();
  if (input.forward) wish.add(forward);
  if (input.back) wish.sub(forward);
  if (input.left) wish.sub(right);
  if (input.right) wish.add(right);
  if (wish.lengthSq() > 0) {
    wish.normalize();
    const wishVel = wish.multiplyScalar(accel * dt);
    state.vel.add(wishVel);
  }

  if (state.vel.length() > maxSpeed) {
    state.vel.setLength(maxSpeed);
  }

  if (input.jump && state.grounded) {
    state.vel.y = jumpImpulse;
    if (input.slide) {
      const horiz = new THREE.Vector3(state.vel.x, 0, state.vel.z);
      horiz.setLength(Math.min(maxSpeed + slideBoost, 18));
      state.vel.x = horiz.x;
      state.vel.z = horiz.z;
    }
    state.grounded = false;
  }

  // gravity
  state.vel.y -= 18 * dt;

  // integrate position
  state.pos.addScaledVector(state.vel, dt);

  // ground collision
  if (state.pos.y < 1.2) {
    state.pos.y = 1.2;
    if (state.vel.y < 0) state.vel.y = 0;
    state.grounded = true;
  }

  // simple bounds
  state.pos.x = Math.max(-55, Math.min(55, state.pos.x));
  state.pos.z = Math.max(-55, Math.min(55, state.pos.z));

  // friction
  const friction = state.grounded ? 8 : 1;
  state.vel.x -= state.vel.x * friction * dt;
  state.vel.z -= state.vel.z * friction * dt;
}

function updateLocal(dt) {
  applyMovement(player, dt, inputs);
  sendInput(dt);
  inputs.jump = false;
}

function connect(match) {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${location.hostname}:3001`;
  network.ws = new WebSocket(url);

  network.ws.addEventListener('open', () => {
    network.connected = true;
    ui.netStatus.textContent = 'Synced';
    ui.netStatus.className = 'tag online';
    network.ws.send(
      JSON.stringify({ type: 'join', matchId: match, name: player.name })
    );
  });

  network.ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'welcome') {
      network.playerId = msg.id;
      logEvent(`Joined match ${match}`);
    }
    if (msg.type === 'state') {
      applyAuthoritativeState(msg);
    }
  });

  network.ws.addEventListener('close', () => {
    network.connected = false;
    ui.netStatus.textContent = 'Disconnected';
    ui.netStatus.className = 'tag offline';
  });
}

function applyAuthoritativeState(msg) {
  const { players, lastProcessed } = msg;
  const me = players.find((p) => p.id === network.playerId);
  if (me) {
    player.pos.set(me.pos.x, me.pos.y, me.pos.z);
    player.vel.set(me.vel.x, me.vel.y, me.vel.z);
    player.yaw = me.yaw;
    player.pitch = me.pitch;
    player.grounded = me.grounded;

    const unprocessed = [];
    for (const input of network.pendingInputs) {
      if (input.seq > lastProcessed) {
        applyMovement(player, input.dt, input.input);
        unprocessed.push(input);
      }
    }
    network.pendingInputs = unprocessed;
  }

  // Update remotes
  const activeIds = new Set();
  players
    .filter((p) => p.id !== network.playerId)
    .forEach((p) => {
      activeIds.add(p.id);
      network.remotePlayers.set(p.id, p);
    });

  // remove stale remotes
  Array.from(network.remotePlayers.keys()).forEach((id) => {
    if (!activeIds.has(id)) {
      const mesh = world.scene.getObjectByName(id);
      if (mesh) world.scene.remove(mesh);
      network.remotePlayers.delete(id);
    }
  });
}

function drawRemotePlayers() {
  // placeholder for more advanced rendering; in this prototype we simply lerp a mesh per remote
  network.remotePlayers.forEach((remote, id) => {
    let mesh = world.scene.getObjectByName(id);
    if (!mesh) {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.6, 0.7),
        new THREE.MeshStandardMaterial({ color: '#f7c948', emissive: '#241f0f' })
      );
      mesh.position.y = 0.8;
      mesh.name = id;
      world.scene.add(mesh);
    }
    mesh.position.lerp(new THREE.Vector3(remote.pos.x, remote.pos.y, remote.pos.z), 0.2);
    mesh.rotation.y = remote.yaw;
  });
}

function animate() {
  const dt = Math.min(0.05, world.clock.getDelta());
  updateLocal(dt);

  world.camera.position.copy(player.pos);
  world.camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

  drawRemotePlayers();
  world.renderer.render(world.scene, world.camera);

  requestAnimationFrame(animate);
}

function startGame() {
  ui.menu.classList.add('hidden');
  ui.game.classList.remove('hidden');
  requestPointer();
  world.clock.start();
  animate();
}

function leaveGame() {
  document.exitPointerLock?.();
  ui.menu.classList.remove('hidden');
  ui.game.classList.add('hidden');
  network.remotePlayers.clear();
}

function setupUI() {
  ui.matchLabel.textContent = `Match: ${matchId}`;
  ui.btnCopyLink?.addEventListener('click', () => {
    const url = `${location.origin}${location.pathname}?match=${matchId}`;
    navigator.clipboard?.writeText(url);
    logEvent('Copied match link');
  });

  document.getElementById('btnPlay').addEventListener('click', startGame);
  document.getElementById('btnTraining').addEventListener('click', startGame);
  document.getElementById('btnCustomize').addEventListener('click', () => logEvent('Customization opens (stub)'));
  document.getElementById('btnQueue').addEventListener('click', startGame);
  document.getElementById('btnPrivate').addEventListener('click', startGame);
  document.getElementById('btnLeave').addEventListener('click', leaveGame);
  ui.btnFullscreen?.addEventListener('click', toggleFullscreen);

  window.addEventListener('resize', () => {
    world.camera.aspect = ui.canvas.clientWidth / ui.canvas.clientHeight;
    world.camera.updateProjectionMatrix();
    world.renderer.setSize(ui.canvas.clientWidth, ui.canvas.clientHeight, false);
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== ui.canvas) {
      ui.netStatus.textContent = 'Pointer unlocked';
      ui.netStatus.className = 'tag offline';
    }
  });

  document.addEventListener('keydown', (e) => handleKey(e, true));
  document.addEventListener('keyup', (e) => handleKey(e, false));
  ui.canvas.addEventListener('click', requestPointer);
  document.addEventListener('mousemove', handlePointer);
}

function init() {
  renderParty();
  renderFriends();
  renderInventory();
  setupScene();
  setupUI();
  connect(matchId);
  logEvent('Menu ready — press Play to lock in');
}

init();
