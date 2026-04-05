# Mech Arena AI 🤖⚔️

> AI-powered mech battle game where you train your mechs with natural language prompts, then watch them battle in Pokémon-style turn-based combat.

**Status**: 🚧 MVP Development

## 🎮 Game Concept

- **Train**: Tune your mech's AI using text prompts ("Focus on defense when low HP")
- **Battle**: Watch your AI fight in turn-based Pokémon-style combat
- **Collect**: Unlock new mech types and cosmetic skins

## 🛠️ Tech Stack

- **Frontend**: Phaser 3 (TypeScript) + PWA
- **Backend**: Vercel Serverless Functions
- **LLM**: Claude Haiku (Anthropic)
- **Storage**: localStorage + IndexedDB (no cloud required)
- **Deployment**: Vercel (auto-deploy from main)

## 📱 Platform

- Mobile web (PWA - Add to home screen)
- Desktop browsers
- Offline-first (Service Worker caching)

## 🚀 MVP Roadmap

- [ ] Phase 1: Single-player prototype (2 weeks)
  - [ ] Basic battle system
  - [ ] 1 mech type, 4 skills
  - [ ] VS Bot battles
  - [ ] Simple prompt input
- [ ] Phase 2: PWA + Collection (2 weeks)
  - [ ] Add to home screen
  - [ ] 3 mech types (fire, water, electric)
  - [ ] Type effectiveness
  - [ ] Battle history
- [ ] Phase 3: Monetization (1 week)
  - [ ] Token system
  - [ ] Premium skins
  - [ ] Stripe checkout
- [ ] Phase 4: PvP (Future)
  - [ ] Real-time matchmaking
  - [ ] Ranked ladder

## 💰 Business Model

- **Free**: 100 daily training tokens, VS Bot battles
- **Paid**: Token packs (¥6-50), Battle Pass (¥30/month), Skins (¥3-50)

## 📊 Cost Analysis

- **Per battle**: ~¥0.00015 (60 tokens to Claude Haiku)
- **3,000 DAU**: ~¥67.50/month LLM cost
- **Revenue target**: ¥6,000/month (5% conversion)

## 🎨 Design References

- Pokémon Fire Red/Emerald battle UI
- Zoids Legacy (GBA) for mech sprites
- Gundam/Transformers aesthetic

## 📝 Documentation

See `docs/` for:
- Game design document
- Technical architecture
- API specifications

## 🤝 Contributing

This is a personal project in early MVP stage. Contributions welcome after v1.0 launch.

## 📄 License

MIT

---

**Made with ❤️ by L Khan**
