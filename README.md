# CrossFireX

Design documents and prototype notes for a small-team tactical shooter built in Unity.

- [Game Design](docs/game_design.md): Core pillars, adaptive loadouts, maps, social features, and technical implementation notes.

## Web Prototype (Browser-First FPS)

A lightweight browser prototype lives in [`web/`](web/) with a Krunker.io-inspired arena, party podium, friends list, and inventory mock. The client uses Three.js, pointer lock, and client-side prediction with server reconciliation over WebSockets.

### Running locally

1. Install dependencies and start the realtime server:
   ```bash
   npm install
   node server.js
   ```
2. Serve the static client (any lightweight server works):
   ```bash
   npx http-server web -p 3000
   ```
3. Visit `http://localhost:3000/?match=dev` to jump into a specific match. Use the "Copy Match Link" button to invite friends. Pointer lock engages when you click the canvas; use the Fullscreen button for an immersive view.

Controls: WASD to move, Shift to slide, Space to jump/slide-hop, mouse to aim, and click to lock pointer. The server runs at 30 ticks per second with slide-hopping movement and reconciliation for low-latency play.
