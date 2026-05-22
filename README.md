# PropAI OS — Admin Panel

Complete admin dashboard for PropAI OS with full API integration.

## Pages

| Route | Description |
|---|---|
| `/admin/login` | JWT login |
| `/admin` | Dashboard with KPIs + recent leads |
| `/admin/properties` | Property grid with filters |
| `/admin/properties/new` | Create property with image upload |
| `/admin/properties/[id]/edit` | Edit existing property |
| `/admin/leads` | Lead inbox with status/source filters + CSV export |
| `/admin/leads/[id]` | Lead detail with AI intent, conversation, status update |
| `/admin/conversations` | Chat session viewer |
| `/admin/settings` | Brand, contact, SEO, banners |

## API Endpoints Used

All from your NestJS backend at `NEXT_PUBLIC_API_URL`:

- `POST /auth/login` — login
- `GET /auth/profile` — profile
- `GET /leads` `GET /leads/stats` `GET /leads/:id` `PATCH /leads/:id/status` `PUT /leads/:id`
- `GET /properties` `POST /properties` `PUT /properties/:id` `DELETE /properties/:id` `DELETE /properties/:id/image/:publicId`
- `GET /chat/:sessionId`
- `GET /settings` `PUT /settings` `POST /settings/logo` `POST /settings/favicon` `POST /settings/banners` `DELETE /settings/banners/:id`

## Setup

```bash
# 1. Copy into your project (alongside propai-web and propai-api)
cp -r propai-admin ../

# 2. Install
cd propai-admin
npm install

# 3. Configure env
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your NestJS backend

# 4. Run
npm run dev   # runs on port 3001
```

## Auth

JWT token stored in `localStorage` as `propai_token`. Auto-redirects to `/admin/login` on 401.
