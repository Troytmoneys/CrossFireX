const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const TICK_RATE = 30;
const DT = 1 / TICK_RATE;

const rooms = new Map();

function getRoom(matchId) {
  if (!rooms.has(matchId)) {
    rooms.set(matchId, { players: new Map() });
  }
  return rooms.get(matchId);
}

function applyMovement(state, input, dt) {
  const accel = input.slide ? 20 : 14;
  const maxSpeed = input.slide ? 16 : 11;
  const jumpImpulse = 8;
  const slideBoost = 4;

  const forward = { x: Math.sin(state.yaw), z: -Math.cos(state.yaw) };
  const right = { x: Math.cos(state.yaw), z: Math.sin(state.yaw) };

  let wish = { x: 0, z: 0 };
  if (input.forward) { wish.x += forward.x; wish.z += forward.z; }
  if (input.back) { wish.x -= forward.x; wish.z -= forward.z; }
  if (input.left) { wish.x -= right.x; wish.z -= right.z; }
  if (input.right) { wish.x += right.x; wish.z += right.z; }

  const len = Math.hypot(wish.x, wish.z);
  if (len > 0) {
    wish.x = (wish.x / len) * accel * dt;
    wish.z = (wish.z / len) * accel * dt;
    state.vel.x += wish.x;
    state.vel.z += wish.z;
  }

  const horizSpeed = Math.hypot(state.vel.x, state.vel.z);
  if (horizSpeed > maxSpeed) {
    const scale = maxSpeed / horizSpeed;
    state.vel.x *= scale;
    state.vel.z *= scale;
  }

  if (input.jump && state.grounded) {
    state.vel.y = jumpImpulse;
    if (input.slide) {
      const scaled = Math.min(maxSpeed + slideBoost, 18);
      const dirLen = Math.hypot(state.vel.x, state.vel.z) || 1;
      state.vel.x = (state.vel.x / dirLen) * scaled;
      state.vel.z = (state.vel.z / dirLen) * scaled;
    }
    state.grounded = false;
  }

  state.vel.y -= 18 * dt;

  state.pos.x += state.vel.x * dt;
  state.pos.y += state.vel.y * dt;
  state.pos.z += state.vel.z * dt;

  if (state.pos.y < 1.2) {
    state.pos.y = 1.2;
    if (state.vel.y < 0) state.vel.y = 0;
    state.grounded = true;
  }

  state.pos.x = Math.max(-55, Math.min(55, state.pos.x));
  state.pos.z = Math.max(-55, Math.min(55, state.pos.z));

  const friction = state.grounded ? 8 : 1;
  state.vel.x -= state.vel.x * friction * dt;
  state.vel.z -= state.vel.z * friction * dt;
}

function tickRoom(room) {
  room.players.forEach((player) => {
    while (player.inputs.length) {
      const next = player.inputs.shift();
      applyMovement(player, next.input, next.dt || DT);
      player.lastProcessedInput = next.seq;
      player.yaw = next.input.yaw;
      player.pitch = next.input.pitch;
    }
  });

  const snapshot = [];
  room.players.forEach((p) => {
    snapshot.push({
      id: p.id,
      name: p.name,
      pos: p.pos,
      vel: p.vel,
      yaw: p.yaw,
      pitch: p.pitch,
      grounded: p.grounded,
      lastProcessedInput: p.lastProcessedInput,
    });
  });

  room.players.forEach((p) => {
    if (p.socket.readyState === p.socket.OPEN) {
      p.socket.send(
        JSON.stringify({
          type: 'state',
          players: snapshot,
          lastProcessed: p.lastProcessedInput,
          serverTime: Date.now(),
        })
      );
    }
  });
}

function createServer() {
  const wss = new WebSocketServer({ port: PORT });
  console.log(`CrossFireX realtime server listening on ws://localhost:${PORT}`);

  wss.on('connection', (socket) => {
    let currentMatch = null;
    let currentPlayerId = null;

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'join') {
          currentMatch = msg.matchId || 'public';
          const room = getRoom(currentMatch);
          currentPlayerId = crypto.randomUUID();
          room.players.set(currentPlayerId, {
            id: currentPlayerId,
            name: msg.name || 'Player',
            pos: { x: 0, y: 1.2, z: 0 },
            vel: { x: 0, y: 0, z: 0 },
            yaw: 0,
            pitch: 0,
            grounded: true,
            inputs: [],
            lastProcessedInput: 0,
            socket,
          });
          socket.send(JSON.stringify({ type: 'welcome', id: currentPlayerId }));
          return;
        }

        if (msg.type === 'input' && currentMatch && currentPlayerId) {
          const room = getRoom(currentMatch);
          const player = room.players.get(currentPlayerId);
          if (!player) return;
          player.inputs.push({ seq: msg.seq, input: msg.input, dt: msg.dt });
        }
      } catch (err) {
        console.error('failed to parse message', err);
      }
    });

    socket.on('close', () => {
      if (!currentMatch || !currentPlayerId) return;
      const room = getRoom(currentMatch);
      room.players.delete(currentPlayerId);
    });
  });

  setInterval(() => {
    rooms.forEach((room) => tickRoom(room));
  }, 1000 / TICK_RATE);
}

createServer();
