# CrossFireX: Small-Team Tactical Shooter Design

## Overview
CrossFireX is a fast-paced 3v3–4v4 tactical shooter centered on short, intense rounds and unpredictable "Adaptive Loadouts." Players receive one randomized special ability each round, forcing creative tactics without bloated content or heavy animation requirements.

## Core Pillars
- **Tight arenas:** Maps roughly the footprint of a Rocket League pitch prioritize immediate engagements, quick rotations, and readable sightlines.
- **Adaptive Loadouts:** Each player starts every round with a fresh random ability, plus a chosen primary weapon and sidearm.
- **Clarity first:** Clean visual language, simple recoil patterns, and punchy SFX keep the focus on movement, peeking, and sound cues.
- **Fast loops:** 10–15 second pre-round, 1–2 minute action phase, first-to-8 scoring.

## Round Flow
1. **Pre-Round (10–15s):** Players select primary + sidearm, see their randomized ability, and receive team callouts for spawns/objectives.
2. **Action (1–2m):** Compact maps reward jiggle peeks, sound-based info, and flanks. Abilities inject chaos and counterplay.
3. **End of Round:** Points tallied; economy optional but can be lightweight (flat stipend + performance bonus).
4. **Ability Shuffle:** Every player rolls a new ability at the next round start to keep matches fresh.

## Weapons (Focused Roster)
- **Primaries:** Assault Rifle, SMG, Pump Shotgun, DMR (semi-auto), Sniper, LMG (high recoil).
- **Sidearms:** Pistol, Revolver, Machine Pistol.
- **Tuning approach:** Simple, learnable recoil curves, clear damage falloff bands, minimal attachments (e.g., suppressor/scope variants only if needed).

## Ability System
Abilities are short-duration, high-readability tools split into categories:

### Movement
- Blink Dash (short teleport)
- Grapple Hook
- Super Jump
- Slide Boost

### Utility
- Deployable Tripwire
- Instant Smoke Bomb
- Flash Beacon
- Pop-Up Shield
- Sensor Dart
- Hologram Clone

### Disruption
- Auto-Turret (low HP, high audio presence)
- EMP Pulse
- Sticky Web Trap
- Heat Vision (3s enemy outline)
- Adrenaline Rush (sprint + reload buff)

**Randomization rules**
- One ability per player per round, rerolled independently.
- Rarity tiers keep extremes in check (e.g., Heat Vision rarer than Smoke).
- Map-safe spawning: abilities that place objects validate navmesh/line-of-sight to avoid exploits.

## Maps (Small, Tactical)
- **Market Alley:** Tight corners, climbable rooftops, destructible stalls for evolving cover.
- **Power Station:** Electric hazards, switch-controlled doors, vent flanks.
- **Void Docks:** Floating cargo, a moving platform on a 30s timer, long sightlines with sparse cover.

## Social & Session Features
Designed to ship on **Unity** with **Photon Fusion** (or NGO) targeting **iOS and other mobile** platforms alongside PC.

### Accounts and Profiles
- Lightweight account link (email/Apple/Google) with display name and unique ID.
- Public profile card: recent matches, favorite loadout, ability mastery badges.
- Privacy controls: public/friends-only/private visibility; mute/block lists respected across matchmaking and chat.

### Friends & Parties
- Bi-directional friends list with presence (online, in lobby, in match) and cross-platform IDs.
- Parties up to 4; leader controls queue and private lobby creation.
- Quick-invite links/QR for mobile; recent players list for re-teaming.

### Chat & Voice
- Text chat channels: party, lobby, team-only in match; profanity filter + region-aware moderation hooks.
- Push-to-talk voice (team/party), with per-user volume and mute; fallback to platform voice APIs on mobile.
- Safety: auto-mute blocked users; report flow with session IDs and voice snippet hashing for moderation handoff.

### Private Matches & Custom Lobbies
- Create passworded or invite-only rooms; party leader chooses map rotation, round count, and friendly fire options.
- Spectator slots (1–2) with delayed info stream to prevent ghosting.
- Ready checks and AFK timeouts to keep rounds brisk.

### Matchmaking & Lobbies
- Quick Play queues for 3v3/4v4; region + latency selection.
- Skill buckets (low/med/high) for casual balance without heavy ranking overhead.
- Lobby browser for custom games with filters (map, mode, ping, privacy).

## Technical Implementation Notes (Unity)
- **Networking:** Photon Fusion (shared mode for authoritative server); tick-aligned movement + client-side prediction + hit-scan reconciliation.
- **Round Manager:** Scriptable state machine: PreRound → Action → RoundEnd → Shuffle; events broadcast to UI and ability system.
- **Ability Framework:** Base `AbilityBehaviour` with activation cost/cooldown, server validation, VFX/SFX hooks, and prediction-friendly movement for dashes.
- **Weapons:** Reusable `WeaponDefinition` assets for damage, spread, fire rate; deterministic recoil tables; lag-compensated raycasts for hit-scan weapons.
- **Platforms:** Mobile-friendly controls (aim assist cone, gyro opt-in, auto-sprint toggle); adaptive quality settings; asset bundles for map/skin updates.
- **Bots (optional):** NavMesh-driven patrols, Fusion networked inputs, built-in aim-assist cone; ability selection mirrors players for testing coverage.

## Roadmap Snapshot (MVP → Live)
1. Graybox one map + 3 abilities + 3 weapons; stand up Fusion session and basic round loop.
2. Add Adaptive Loadouts (reroll per round), killfeed, and minimal UI for ability surfacing.
3. Integrate parties, lobby browser, and private match flow; add text chat with blocklist enforcement.
4. Ship mobile input polish (gyro/aim-assist), voice chat, and moderation/reporting hooks.
5. Expand abilities/weapons, art pass for readability, and live-ops telemetry for balance.
