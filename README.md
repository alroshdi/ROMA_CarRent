# CarRent Oman — Full Stack Car Rental Platform

A complete car rental website built from the design analysis spec.

**Backend:** Laravel 12 + Sanctum + DomPDF + SQLite  
**Frontend:** React + TypeScript + Vite + Tailwind CSS  
**Payment:** Multi-gateway architecture (Thawani integrated; mock mode for local dev)

## Features

### Customer
- Browse available cars with date-based availability filtering
- Phone + PIN authentication (self-set PIN, no OTP)
- Full booking flow: details → price summary → contract PDF → e-signature → online payment (Thawani)
- WhatsApp redirect after successful payment
- My Bookings with cancellation (48-hour refund policy)
- Overlapping booking prevention per customer

### Admin Panel (`/admin`)
- Analytics dashboard
- Car, driver, and customer management
- Booking status management
- Contract template CRUD with dynamic variables
- Payment transaction log
- Customer PIN reset (for WhatsApp support workflow)

## Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+

### Backend

```bash
cd backend
composer install
cp .env.example .env   # if .env doesn't exist
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Default Credentials

| Role | Credentials |
|------|-------------|
| Admin | `admin@carrent.om` / `password` |
| Customer | Register with any phone + 6-digit PIN |

## Environment Variables

Add to `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
WHATSAPP_NUMBER=+96812345678
PAYMENT_DEFAULT_GATEWAY=thawani
THAWANI_MOCK=true

# For production Thawani:
# THAWANI_MOCK=false
# THAWANI_SECRET_KEY=your_secret
# THAWANI_PUBLISHABLE_KEY=your_key
# THAWANI_WEBHOOK_SECRET=your_webhook_secret
# THAWANI_BASE_URL=https://checkout.thawani.om/api/v1
# THAWANI_CHECKOUT_URL=https://checkout.thawani.om

# Webhook URL (register in Thawani dashboard):
# POST https://your-api.com/api/payments/webhook/thawani
```

## Project Structure

```
carrent/
├── backend/          # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/     # Thawani, Contract, Booking
│   │   └── Policies/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/         # React SPA
│   └── src/
│       ├── pages/        # Customer pages
│       └── pages/admin/  # Admin panel
└── car-rental-website-design-analysis.md
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cars` | List cars (optional date filter) |
| POST | `/api/auth/register` | Customer registration |
| POST | `/api/auth/login` | Customer login |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/{id}/contract` | Generate contract PDF |
| POST | `/api/bookings/{id}/sign` | E-sign contract |
| POST | `/api/payments/checkout` | Create Thawani session |
| POST | `/api/admin/auth/login` | Admin login |
| GET | `/api/admin/analytics` | Dashboard metrics |

## Payment Flow (Mock Mode)

With `THAWANI_MOCK=true`, checkout redirects directly to the success page and auto-confirms payment. Set `THAWANI_MOCK=false` and configure Thawani keys for production.

## License

MIT
