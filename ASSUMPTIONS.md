# ASSUMPTIONS.md — Recorded Engineering Assumptions

1. **Free-Tier Hosting & DB**: Assumes Cloudflare Workers + Durable Objects free tier and Supabase free tier (no paid billing or custom paid domain assumed).
2. **Package Manager**: `pnpm` is the sole authoritative package manager (`pnpm-lock.yaml`).
3. **Legal Documents**: `PRIVACY_POLICY.md`, `TERMS.md`, and `COOKIE_POLICY.md` are engineering drafts (`<!-- DRAFT — requires legal review -->`) and require counsel review before commercial launch.
4. **DiceBear Package Line**: Installed `@dicebear/core@9.4.3` + `@dicebear/collection@9.4.2` (MIT core; per-style CC0/CC-BY licenses) because v11 packages are not yet published on npm (`@dicebear/core@11.0.0` does not pair with `@dicebear/collection@9.4.2`).
5. **ALTCHA Fallback**: When running locally in `vite dev` without Cloudflare Worker `/api/altcha/challenge`, `AltchaWidget` uses a local dev token fallback; production Cloudflare Worker enforces real HMAC-SHA256 verification.
