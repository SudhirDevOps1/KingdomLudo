# Contributing to KingdomLudo

Thank you for contributing!

## Development Workflow

1. Fork the repository and create a feature branch using Conventional Commits (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
2. Install dependencies: `npm install`.
3. Start the full-stack server in dev mode: `npm run dev`.
4. Ensure all checks pass before opening a pull request:
   - `npm run lint`
   - `npm test`
   - `npm run build`

## Originality & Licensing Rules

- Do **not** commit copyrighted third-party 3D models, audio, or source code from commercial Ludo games.
- Document any new third-party open-source asset in `docs/ASSET_LICENSES.md` with its exact license and attribution.
- Never commit `.env`, Firebase service keys, or Android `.jks` keystores.
