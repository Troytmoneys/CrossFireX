# Prototype Setup (Unity)

This repo ships a lightweight set of Unity C# scripts under `Assets/Scripts/` that implement the adaptive-loadout round loop, random ability assignment, and loadout tracking for players.

## Importing the scripts
1. Create or open a Unity 2022 LTS project.
2. Copy the `Assets/` folder from this repo into your Unity project (merge if `Assets` already exists).
3. Create ScriptableObjects for weapons and abilities (Assets > Create > CrossFireX > ...).
4. Add a `RoundManager` to an empty GameObject in your scene, then assign:
   - **Ability Pool**: A `AbilityPool` asset containing ability definitions.
   - **Primary Options / Sidearm Options**: Lists of weapon assets.
   - **Player Ability Controllers**: References to player objects with `PlayerAbilityController` components.

## Wiring players
- Add `PlayerAbilityController` to your player prefab or character object. Hook the UnityEvents to spawn VFX, play sounds, or drive movement changes (e.g., apply a dash impulse).
- When the round starts, `RoundManager` will call `SetAbility` on each controller with a random ability pulled from the configured pool.
- Call `TryActivate()` from input code to trigger the current ability; it enforces cooldowns automatically.

## Round loop
- Call `BeginMatch()` on the `RoundManager` to start the repeating loop:
  1. **PreRound**: Loadouts roll; UI can display the assigned ability and weapons.
  2. **Action**: Active gameplay window; inputs should be enabled.
  3. **RoundEnd**: Small buffer for celebration/transition; then the loop repeats with new abilities.
- Subscribe to `onRoundPhaseChanged` to update HUD timers and lock inputs.
- Subscribe to `onLoadoutsRolled` to refresh player HUD with newly assigned ability info.

## Extending the prototype
- Network authority: run the `RoundManager` on the host/server and replicate loadouts to clients via your chosen networking stack (Photon Fusion or Unity Netcode).
- Abilities: derive ability behaviours from `PlayerAbilityController` event hooks or attach bespoke scripts that listen to `onAbilityActivated`.
- Weapons: the provided `WeaponDefinition` ScriptableObjects are intentionally simple; integrate them with your shooting implementation (raycasts or projectiles) and animation/audio controllers.
- Bots: spawn AI agents that also receive loadouts by adding their `PlayerAbilityController` to the `RoundManager` list.

## Suggested test values
- PreRound: 10–15 seconds
- Action: 75–100 seconds for small arenas
- RoundEnd: 5–8 seconds
