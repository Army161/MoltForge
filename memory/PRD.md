# MoltForge PRD

## Problem Statement
Build a production-ready managed agent-install platform called "MoltForge" that delivers the same user experience pattern as a one-click managed agent launcher, with own infrastructure, authentication, secrets, deployment flow, and control UI.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: Emergent Google OAuth + Email/Password (bcrypt)
- **LLM**: OpenAI via emergentintegrations (pluggable: openai/anthropic/gemini via env vars)
- **Billing**: Stripe via emergentintegrations
- **Theme**: Cyber-industrial dark (teal/cyan primary, amber secondary)

## DB Collections
- `users` - user accounts (user_id, email, name, auth_provider)
- `user_sessions` - session tokens with expiry
- `workspaces` - tenant workspaces (workspace_id, user_id, name, status)
- `install_jobs` - provisioning jobs with state machine
- `install_logs` - structured logs per job/phase
- `chat_messages` - chat history per workspace
- `deploy_configs` - deploy/persist toggle per workspace
- `channels` - Telegram/WhatsApp connections
- `provider_settings` - LLM provider config per workspace
- `payment_transactions` - Stripe payment records
- `audit_logs` - audit trail for all workspace actions

## API Routes
- Auth: `/api/auth/session`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`
- Workspaces: `/api/workspaces` (CRUD), restart
- Install Jobs: `/api/workspaces/{id}/jobs`, `/api/jobs/{id}`, `/api/jobs/{id}/logs`, retry
- Chat: `/api/workspaces/{id}/chat`, `/api/workspaces/{id}/chat/history`
- Deploy: `/api/workspaces/{id}/deploy` (GET/PUT)
- Channels: `/api/workspaces/{id}/channels` (CRUD)
- Settings: `/api/workspaces/{id}/settings` (GET/PUT)
- Billing: `/api/billing/plans`, `/api/billing/checkout`, `/api/billing/status/{id}`, `/api/billing/transactions`, `/api/webhook/stripe`
- Admin: `/api/admin/jobs`, `/api/admin/users`, `/api/admin/audit`, `/api/admin/stats`

## Install State Machine
`queued → provisioning → bootstrapping → healthy | failed`
- Each phase writes structured logs to MongoDB
- Background asyncio task (non-blocking)
- Idempotent: retry creates new job
- Real-time log polling from frontend every 2s

## Pages Implemented
1. `/` - Landing page (hero, features, pricing)
2. `/login` - Auth page (Google OAuth + email)
3. `/dashboard` - Workspace list + stats
4. `/workspace/new` - 3-step workspace creation wizard
5. `/workspace/:id/install` - Install progress + live logs
6. `/workspace/:id/panel` - Agent control panel (chat, logs, channels, settings tabs)
7. `/workspace/:id/channels` - Telegram + WhatsApp integration
8. `/workspace/:id/deploy` - Deploy/persist toggle + scheduler
9. `/billing` - Stripe billing plans + transaction history
10. `/settings` - LLM provider config + BYOK
11. `/admin` - System stats, all jobs, users, audit logs

## Security
- 256-bit entropy tokens (secrets.token_urlsafe(32))
- httpOnly cookies with secure=True, samesite=none
- Secrets never returned in API responses
- Audit logs for all workspace actions
- BYOK keys stored but never returned in listings
- Tenant isolation enforced on all workspace routes

## Environment Variables
- `MONGO_URL`, `DB_NAME` - MongoDB connection
- `EMERGENT_LLM_KEY` - Platform LLM key (OpenAI-compatible)
- `STRIPE_API_KEY` - Stripe key (sk_test_emergent provided)
- `LLM_PROVIDER`, `LLM_MODEL` - Default LLM config
- `CORS_ORIGINS` - CORS allowed origins

## What's Implemented (2026-03-10)
- Full backend API (server.py ~550 lines)
- All 11 frontend pages
- Google OAuth via Emergent + email auth
- Real OpenAI chat (gpt-5.2) via emergentintegrations
- Stripe billing checkout + transaction tracking
- Install job state machine with background asyncio tasks
- Live log terminal viewer with 2s polling
- Deploy/persist toggle with cron scheduler
- Channel integrations (Telegram, WhatsApp)
- Admin observability (stats, jobs, users, audit)
- Cyber-industrial dark theme (IBM Plex Sans + Azeret Mono)

## Prioritized Backlog
### P0 (Core - Done)
- [x] Landing page
- [x] Auth (Google OAuth + email)
- [x] Workspace creation
- [x] Install state machine
- [x] Progress/logs page
- [x] Control panel + chat
- [x] Deploy toggle
- [x] Billing (Stripe)
- [x] Settings/BYOK
- [x] Admin observability

### P1 (Next Phase)
- [ ] Real Telegram bot webhook integration
- [ ] Real WhatsApp integration (Twilio/Meta)
- [ ] Usage metrics (token counts per workspace)
- [ ] Email notifications on job failures
- [ ] Workspace environment variable management
- [ ] Agent template marketplace

### P2 (Future)
- [ ] Multi-user workspace collaboration
- [ ] Custom domain routing for agents
- [ ] Kubernetes-backed real provisioning
- [ ] Vault-based secret management
- [ ] SSO/SAML for enterprise
- [ ] Metrics dashboard (Recharts usage graphs)
