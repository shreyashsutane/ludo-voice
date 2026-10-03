# Ludo Voice
Online multiplayer Ludo (2-4 players) with WebRTC voice chat. React + TypeScript client, Cloudflare Worker + Durable Object server.
## Run
    npm install
    npm run dev        # builds, then serves at http://localhost:8787 (open in 2 tabs; mic works on localhost)
## Deploy (free)
    npx wrangler login
    npm run deploy     # gives you https://ludo-voice.<you>.workers.dev
## Voice behind strict mobile networks (optional TURN)
Cloudflare dashboard > Realtime > TURN > create a key, then:
    npx wrangler secret put TURN_KEY_ID
    npx wrangler secret put TURN_API_TOKEN
Without these, voice uses STUN only and may fail for some mobile carriers.
## Rules implemented
Six to leave yard; exact roll to reach home; six, capture, or reaching home gives another roll; star/start squares are safe; first to bring 4 home wins.
## Not included yet
Turn timers/bots for AFK players, 3-sixes rule, PWA manifest/icons, tests. Reconnect works (same browser keeps its seat).

See SECURITY.md before going live. Run `npm run typecheck` and `npm run audit` before deploying.
