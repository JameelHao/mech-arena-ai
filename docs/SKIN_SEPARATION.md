# Skin Separation: Cosmetic vs Combat Behavior

## Principle

Skins are **cosmetic only**. They change the visual appearance of a mech (sprites, portraits, thumbnails) but have **no effect** on combat stats, AI decisions, or battle outcomes.

## Architecture

```
Cosmetic Layer (Skins)          Behavior Layer (Combat)
┌─────────────────────┐        ┌──────────────────────┐
│ SkinPackManifest     │        │ MECH_ROSTER          │
│  - id, name          │        │  - hp, maxHp, skills │
│  - codename          │        │  - type, damage      │
│  - themeColor        │        ├──────────────────────┤
│  - baseType (visual) │        │ CombatCore           │
├─────────────────────┤        │  - name, prompt      │
│ SkinPack             │        ├──────────────────────┤
│  - mechSprite        │        │ mechPrompt           │
│  - portraits         │        │  (player free text)  │
│  - thumbnail         │        └──────────┬───────────┘
└──────────┬──────────┘                    │
           │                               ▼
           ▼                        buildPrompt() → Claude API
    Phaser rendering                       │
    (visual only,                          ▼
     never sent to API)            AI move decision
```

## Rules

1. **SkinPack types** (`src/types/skin.ts`) must only contain visual/identity fields. Never add `hp`, `damage`, `skills`, or any combat modifier.

2. **Battle API request** (`src/api/battleClient.ts`) must never include `skinId` or any skin-related data. The `buildRequestBody` function only sends `mechPrompt`, `gameState` (HP, skills, status effects), and `combatCore`.

3. **Prompt construction** (`api/battle.ts`) must only use `combatCore.prompt`, `mechPrompt`, and `gameState`. Skin names or identifiers must not appear in the AI prompt.

4. **UI wording** must present skins as "Appearance" — a visual/cosmetic choice. Avoid terms like "upgrade", "enhance", or "power" in skin-related UI.

## What Drives Battle Behavior

| Source | What it controls |
|--------|-----------------|
| `MECH_ROSTER` | Base stats: HP, skills, damage values, type |
| `CombatCore` | AI personality: aggressive/balanced/defensive prompt |
| `mechPrompt` | Player's free-text tactical instructions |
| `BattleManager` | Type effectiveness, damage calculation, win condition |

## Future: If Skins Need Combat Effects

If a future design decision requires skins to influence combat:

1. Create a new `SkinCombatModifier` interface (separate from `SkinPack`)
2. Add a migration path that keeps existing skins backward-compatible
3. Update `buildRequestBody` to include modifier data
4. Update `buildPrompt` to communicate modifiers to the AI
5. Update this document and all related tests
