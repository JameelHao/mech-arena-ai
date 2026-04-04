# Mech Arena AI - Design Document

**Version**: 1.0  
**Date**: 2026-04-04  
**Author**: Product Manager Agent

---

## Executive Summary

Mech Arena AI is a web-based turn-based battle game where players train AI-controlled mechs using natural language prompts, then watch them fight in Pokémon-style combat. The core innovation is prompt-driven AI behavior instead of manual controls.

**Key Metrics**:
- **Target**: 3,000 DAU within 6 months
- **Revenue**: ¥6,000/month (¥50,000 MRR by month 6)
- **Cost**: ¥67.50/month LLM usage at scale
- **Retention**: 50% D1, 30% D7

---

## Game Design

### Core Loop

1. **Train** - Write prompts to teach your mech strategy
2. **Battle** - Watch AI execute your strategy in turn-based combat
3. **Improve** - Refine prompts based on battle performance
4. **Collect** - Unlock new mechs and skins

### Battle System

**Format**: 1v1 turn-based (Pokémon-style)

**Turn Flow**:
```
Player Mech AI reads:
  - Current HP/Energy
  - Opponent last move
  - Status effects
  - Player's prompt ("When low HP, defend")
  
→ Picks 1 of 4 skills
→ Execute move
→ Opponent's turn
→ Repeat until winner
```

**Skills** (4 per mech):
- Fire Blast (high damage, fire type)
- Water Cannon (medium damage, water type)
- Thunder Shock (fast, electric type)
- Iron Defense (reduce damage, no type)

**Type Effectiveness**:
- Fire > Electric > Water > Fire
- Neutral damage: 1.0x
- Super effective: 1.5x
- Not very effective: 0.5x

**Status Effects**:
- Burn (damage over time, -20% attack)
- Poison (damage over time)
- Stun (skip turn)

---

## Technical Architecture

### Frontend

**Framework**: Phaser 3 (TypeScript)
- Battle scene rendering
- Sprite animations
- UI components

**PWA Features**:
- Service Worker (offline caching)
- Add to home screen
- Push notifications

**Storage**:
```typescript
// localStorage (5-10 MB)
{
  "currentMech": { id, name, type, level, prompt },
  "tokens": 100,
  "settings": { ... }
}

// IndexedDB (hundreds of MB)
{
  "battles": [
    { date, opponent, result, turns[], promptUsed }
  ],
  "mechs": [
    { id, name, type, skills[], promptHistory[] }
  ]
}
```

### Backend

**Platform**: Vercel Serverless Functions

**Endpoints**:

`POST /api/battle`
```typescript
Request: {
  mechPrompt: string,
  gameState: {
    playerHP: number,
    opponentHP: number,
    lastMove: string,
    statusEffects: string[]
  }
}

Response: {
  move: 0 | 1 | 2 | 3, // skill index
  reasoning: string    // debug only
}
```

`POST /api/checkout` (Stripe)
```typescript
Request: { package: 'small' | 'medium' | 'large' }
Response: { checkoutUrl: string }
```

**LLM Integration** (Claude Haiku):
```typescript
const prompt = `You are a battle AI. Current state:
- Your HP: ${playerHP}/100
- Opponent HP: ${opponentHP}/100
- Opponent last used: ${lastMove}

Your strategy: "${mechPrompt}"

Available skills:
0. Fire Blast (40 dmg, fire)
1. Water Cannon (30 dmg, water)
2. Thunder Shock (25 dmg, electric, fast)
3. Iron Defense (reduce damage 50% this turn)

Pick ONE skill number (0-3):`;
```

---

## Monetization

### Free Tier
- 100 daily training tokens
- Unlimited VS Bot battles
- 1 starter mech
- Basic skins

### Paid Options

**Token Packs**:
| Package | Tokens | Price | ¥/Token |
|---------|--------|-------|---------|
| Small   | 500    | ¥6    | ¥0.012  |
| Medium  | 1,500  | ¥18   | ¥0.012  |
| Large   | 5,000  | ¥50   | ¥0.010  |

**Battle Pass** (¥30/month):
- 1,000 daily tokens
- 3 premium mechs
- 5 exclusive skins
- Priority matchmaking (PvP)

**Skins**:
- Recolors: ¥3-5
- Animated: ¥10-20
- Legendary: ¥50

---

## Cost Economics

### LLM Usage

**Per Battle**:
- Input: 50 tokens (game state + prompt)
- Output: 10 tokens (skill choice)
- Avg battle: 6 turns = 360 tokens
- Cost: ~¥0.00015/battle (Claude Haiku)

**At Scale** (3,000 DAU, 5 battles/day each):
- 15,000 battles/day
- 450,000 battles/month
- Cost: **¥67.50/month**

**Revenue** (5% conversion, ¥40 ARPPU):
- 150 paying users
- **¥6,000/month**

**Profit margin**: 98.9%

---

## MVP Roadmap

### Phase 1: Prototype (Week 1-2)

**Goal**: Playable single-player demo

**Features**:
- [ ] Phaser 3 battle scene
- [ ] 1 mech type (Fire)
- [ ] 4 basic skills
- [ ] VS Bot (random moves)
- [ ] Text prompt input
- [ ] localStorage save/load
- [ ] `/api/battle` endpoint
- [ ] Claude Haiku integration

**Deliverable**: `https://mech-arena.vercel.app/demo`

---

### Phase 2: PWA + Collection (Week 3-4)

**Goal**: Mobile-optimized installable app

**Features**:
- [ ] PWA manifest + Service Worker
- [ ] Add to home screen
- [ ] 3 mech types (Fire, Water, Electric)
- [ ] Type effectiveness system
- [ ] IndexedDB battle history
- [ ] Prompt versioning (save/load past prompts)
- [ ] Win/loss stats
- [ ] Improved animations

**Deliverable**: Mobile PWA ready for beta testing

---

### Phase 3: Monetization (Week 5)

**Goal**: Revenue-ready version

**Features**:
- [ ] Token system (daily limit)
- [ ] Stripe checkout integration
- [ ] Token packs (3 tiers)
- [ ] 3 premium skins
- [ ] Daily login rewards
- [ ] Token usage tracking

**Deliverable**: Public launch version

---

### Phase 4: PvP (Future)

**Features**:
- [ ] Real-time matchmaking (Supabase Realtime)
- [ ] Ranked ladder (ELO system)
- [ ] Leaderboards
- [ ] Battle replays
- [ ] Friend battles

**Timeline**: After MVP validation (1-2 months)

---

## Design Assets

### Visual Style

**UI Layout** (Pokémon-inspired):
```
┌─────────────────────────┐
│   [Opponent Mech]       │
│   HP: ████████░░ 80/100 │
│                         │
│   [Battle Log]          │
│   > Fire Blast!         │
│   > It's super effective!│
│                         │
│   HP: ██████████ 100/100│
│   [Your Mech]           │
│                         │
│ [Fire] [Water] [Elec] [Def] │
└─────────────────────────┘
```

**Color Palette**:
- Fire: `#FF4500` (Orange Red)
- Water: `#1E90FF` (Dodger Blue)
- Electric: `#FFD700` (Gold)
- Background: `#1a1a1a` (Dark)
- Text: `#ffffff` (White)
- Accent: `#00ff88` (Neon Green)

**Mech Sprite Style**:
- Pixel art (32x32 or 64x64)
- Gundam/Transformers aesthetic
- 3 frame idle animation
- Attack effect particles

---

## Risk Mitigation

### Technical Risks

**Risk**: LLM picks random moves despite prompt  
**Mitigation**:
- Add few-shot examples in system prompt
- JSON schema enforcement (output: `{"move": 0}`)
- Fallback to rule-based AI if LLM fails

**Risk**: Slow LLM response (2s delay)  
**Mitigation**:
- Show "AI is thinking..." animation
- Stream LLM response for faster perceived speed
- Cache common prompts

**Risk**: API abuse (spam prompts)  
**Mitigation**:
- Rate limiting (1 request/second)
- Token cost per training session
- Captcha for free tier

---

## Success Metrics

### Week 1 Goals
- [ ] 100 unique players
- [ ] 30% D1 retention
- [ ] 5+ battles per user

### Month 1 Goals
- [ ] 1,000 MAU
- [ ] 40% D1, 20% D7 retention
- [ ] 50+ paying users
- [ ] ¥2,000 MRR

### Month 6 Goals
- [ ] 10,000 MAU
- [ ] 50% D1, 30% D7 retention
- [ ] 500+ paying users
- [ ] ¥50,000 MRR

---

## Competitive Analysis

| Game | Similarity | Our Edge |
|------|------------|----------|
| Pokémon Showdown | Turn-based battles | AI prompt training |
| Clash Royale | Mobile F2P | Web-first, turn-based |
| Auto Chess | AI units | Direct strategy control |
| Custom Robo | Mech collection | Web, no download |

**USP**: Only game where you "code" your fighter's brain with natural language.

---

## Marketing Plan

### Launch Channels
1. **Product Hunt** - Tech early adopters
2. **Reddit** - r/gamedev, r/MachineLearning, r/WebGames
3. **Twitter/X** - #indiegame #AIgames hashtags
4. **Discord** - AI/gamedev communities

### Viral Mechanics
- Share battle replays (Twitter cards)
- Weekly "Best Prompt" challenges
- Leaderboard screenshots
- Twitch/YouTube gameplay

### Press Kit
- Screenshots (battle UI)
- GIFs (combat animations)
- "Train AI with prompts" tagline
- Developer blog post

---

## Next Steps

1. [x] Create GitHub repo
2. [ ] Set up Phaser 3 + TypeScript boilerplate
3. [ ] Design battle UI mockup (Figma)
4. [ ] Implement basic battle loop
5. [ ] Integrate Claude API
6. [ ] Deploy to Vercel
7. [ ] Beta test with 10 users

---

**Document Status**: ✅ Complete  
**Last Updated**: 2026-04-04  
**Next Review**: After Phase 1 completion
