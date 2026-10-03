# Security audit notes
## Fixed in this version
| Issue | Severity | Fix |
|---|---|---|
| Player IDs were broadcast to everyone and also served as login, so any player could take over another's seat | High | Browser keeps a secret key; server derives a public ID from its SHA-256 hash and never sends the key |
| Any string accepted as a room name, so anyone could create unlimited Durable Objects | Medium | Server only accepts 6-character codes; created rooms use crypto-random codes |
| No Origin check on WebSocket upgrade | Medium | Same-origin only |
| No message size, rate or socket limits | Medium | 8 KB message cap, 120 msgs/10 s per socket, 16 sockets per room |
| Messages from unjoined sockets, and a client-controlled `from` in voice signaling | Medium | Server requires join first and stamps `from` itself |
| Stuck games when a player disconnects (availability) | Medium | 30 s turn timer via Durable Object alarms; two missed turns hands the seat to a bot until they return |
| Names and emojis | Low | Control characters and angle brackets stripped, emojis allowlisted, React escapes output, CSP blocks injected scripts |
| Dice used Math.random | Low | crypto.getRandomValues with rejection sampling |
| No security headers | Medium | CSP, nosniff, frame-deny, Permissions-Policy, HSTS in `public/_headers` |
| TURN credential endpoint callable per request | Low | Same-site check, 4 h credential TTL, cached 1 h |
| Abandoned rooms stored forever; stack traces on errors | Low | Idle rooms deleted after 24 h; generic 500 |
## You still need to do
1. Cloudflare dashboard > Security > WAF > Rate limiting: add a rule for `/ws/*` and `/api/*` (for example 30 requests/minute per IP).
2. Cloudflare dashboard > set a usage alert on Realtime TURN. Anyone who opens the site can get short-lived TURN credentials, which is unavoidable with this design.
3. Commit `package-lock.json`, then run `npm run audit` before each deploy.
## Known limits
- Identity is per browser. Clearing site data loses your seat.
- Voice is peer-to-peer, so players can see each other's IP addresses. Use TURN relay-only mode if that matters.
- Anyone with a room code can join the lobby; only the first player can start.
- The leaderboard can be farmed by one person playing against themselves in several tabs. Rankings are for fun, not prizes.
- No automated tests, and no penetration test beyond this code review.
