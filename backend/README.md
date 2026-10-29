# Darna Backend API (NestJS 11 + Prisma 6 + PostgreSQL)

Complete backend API for **Darna (دارنا)** — homemade Arabic food marketplace.

## Tech Stack & Security
- **Framework**: NestJS 11 (`@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`)
- **Database & ORM**: PostgreSQL + Prisma 6 (`prisma/schema.prisma` + `prisma/seed.ts`)
- **Authentication**: JWT Access + Refresh tokens (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) & password hashing (`bcryptjs`, 12 rounds)
- **Authorization**: Global `JwtAuthGuard`, `@Public()` route opt-out, and `@Roles(Role.CUSTOMER | Role.COOK | Role.ADMIN)` guard
- **Rate Limiting**: `@nestjs/throttler` global guard (100 req/min default) + strict endpoint limits on `/api/auth/login` (8/min), `/api/auth/register` (5/min), `/api/auth/change-password` (5/min), `/api/cooks/apply` (5/min), `/api/orders` (15/min), `/api/reviews` (6/min), `/api/dishes/:id/report` (5/min), and `/api/support/tickets` (5/min)
- **HTTP Security & Validation**: `helmet` security headers, CORS restricted to `FRONTEND_ORIGIN`, strict global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`), and privacy stripping so a cook's private home address and exact door instructions are **never** exposed publicly (only returned on confirmed/paid orders).

## Quick Start

```bash
cd backend

# 1. Configure PostgreSQL connection in .env
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/darna?schema=public"

# 2. Push Prisma schema & seed initial Darna data
npm run prisma:push
npm run prisma:seed

# 3. Start development server (http://localhost:4000/api)
npm run start:dev
```

## Seeded Demo Accounts (Password: `Darna2026!`)
- **Customer**: `sarah.devries@example.nl`
- **Cook (Rana)**: `rana@darna.nl`
- **Cook (Omar)**: `omar@darna.nl`
- **Cook (Fatima)**: `fatima@darna.nl`
- **Cook (Samira)**: `samira@darna.nl`
- **Admin**: `admin@darna.nl`

## API Endpoints (`/api`)

### Auth (`/api/auth`)
- `POST /api/auth/register` — Register customer or cook (rate-limited: 5/min)
- `POST /api/auth/login` — Login & receive `accessToken` + `refreshToken` (rate-limited: 8/min)
- `POST /api/auth/refresh` — Rotate access/refresh tokens
- `POST /api/auth/logout` — Revoke refresh token
- `POST /api/auth/change-password` — Change password
- `GET /api/auth/me` — Current authenticated user

### Users, Favorites & Notifications (`/api/users`)
- `GET /api/users/me` — Full customer profile + counts
- `PATCH /api/users/me` — Update customer profile & language (`nl` | `en` | `ar`)
- `GET /api/users/me/favorites` — Saved dishes & favorite cooks
- `POST /api/users/me/favorites/dishes/:dishId` — Toggle favorite dish
- `POST /api/users/me/favorites/cooks/:cookId` — Toggle favorite cook
- `GET /api/users/me/notifications` — List notifications
- `POST /api/users/me/notifications/read-all` — Mark all notifications read

### Cooks (`/api/cooks`)
- `GET /api/cooks` — Public verified cooks list (never exposes exact address)
- `GET /api/cooks/:id` — Public cook profile + live dishes + reviews
- `POST /api/cooks/apply` — Submit cook verification application (rate-limited: 5/min)
- `GET /api/cooks/me/dashboard` — Cook KPIs, recent orders, dishes, payouts
- `GET /api/cooks/me/profile` / `PATCH /api/cooks/me/profile` — Cook profile & bank settings
- `GET /api/cooks/me/availability` / `PATCH /api/cooks/me/availability` — Kitchen open toggle, daily capacity, pickup days & slots
- `GET /api/cooks/me/earnings` — Cook earnings breakdown & payout history

### Dishes (`/api/dishes`)
- `GET /api/dishes` — Explore dishes (`cuisine`, `dietary`, `pickup`, `cookId`, `q`, `featured`, `weekend`, `family`, `availableOnly`)
- `GET /api/dishes/:id` — Dish detail + reviews + more from this cook
- `GET /api/dishes/cook/me` — Cook's own dishes
- `POST /api/dishes` — Create dish (6-step wizard)
- `PATCH /api/dishes/:id` — Edit dish
- `DELETE /api/dishes/:id` — Delete dish
- `POST /api/dishes/:id/report` — Report dish (rate-limited: 5/min)

### Cart (`/api/cart`)
- `GET /api/cart` — Current user's cart + subtotal/serviceFee/total
- `POST /api/cart/items` — Add item to cart. Enforces **one cook per cart**: returns `409 Conflict` (`code: "DIFFERENT_COOK"`) with localized NL/EN/AR confirmation dialog payload when switching kitchens
- `POST /api/cart/replace` — Empty cart and start new order with the new cook's dish
- `PATCH /api/cart/items/:dishId` — Update dish quantity
- `DELETE /api/cart` — Clear cart

### Orders (`/api/orders`)
- `POST /api/orders` — Place pickup order (atomic transaction decrementing `portionsLeft`, single-cook validation)
- `GET /api/orders` — Customer's orders
- `GET /api/orders/:id` — Order details (includes cook's exact pickup instructions only on paid/active orders)
- `POST /api/orders/:id/cancel` — Cancel order & restore dish portions
- `GET /api/orders/cook/me` — Cook's incoming/preparing/ready/completed orders
- `PATCH /api/orders/cook/:id/status` — Update order status (`CONFIRMED` → `PREPARING` → `READY` → `COMPLETED`)

### Reviews (`/api/reviews`)
- `GET /api/reviews` — List reviews (`cookId`, `dishId`)
- `POST /api/reviews` — Submit review & recalculate cook/dish ratings

### Admin (`/api/admin` — requires `ADMIN` role)
- `GET /api/admin/overview` — KPIs, revenue & orders series, top cooks, verification queue
- `GET /api/admin/orders` / `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/cooks` / `PATCH /api/admin/cooks/:id/status`
- `POST /api/admin/verifications/:id/approve` / `POST /api/admin/verifications/:id/request-changes`
- `GET /api/admin/dishes` / `PATCH /api/admin/dishes/:id/status` / `DELETE /api/admin/dishes/:id`
- `GET /api/admin/payouts` / `PATCH /api/admin/payouts/:id/status` / `POST /api/admin/payouts/run`
- `GET /api/admin/disputes` / `POST /api/admin/disputes/:id/resolve`
- `GET /api/admin/settings` / `PATCH /api/admin/settings`

### Catalog & Support
- `GET /api/health` — Health check
- `GET /api/catalog` — Cuisines, allergens, dietary tags, pickup options, service fee
- `POST /api/support/tickets` — Submit help center message (rate-limited: 5/min)
