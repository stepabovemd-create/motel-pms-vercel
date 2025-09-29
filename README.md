## Motel PMS (Vercel / Next.js)

This app runs on Next.js and is ready for Vercel:
- Brand-specific pages at `/{brand}` and application forms at `/{brand}/apply`
- Stripe Checkout at `/api/checkout/session` and webhook at `/api/webhooks/stripe`
- Applications stored in Vercel Postgres via `@vercel/postgres`
- Reminders endpoint at `/api/reminders` for Vercel Cron

### Environment Variables (Vercel Project Settings)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL` (e.g., `https://your-domain.vercel.app`)
- `POSTGRES_URL` (created when you add Vercel Postgres integration)

### Local Dev
```bash
cd vercel-app
npm install
npm run dev
```

### Deploy to Vercel
1. Create a new Vercel project and import the `vercel-app` directory
2. Add the environment variables above
3. Add Vercel Postgres Integration
4. Deploy

### Stripe Webhook
Add a webhook endpoint in the Stripe Dashboard pointing to `/api/webhooks/stripe` and paste the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

### Reminders (Vercel Cron)
Use Vercel Cron to call `/api/reminders` daily (e.g., at 9am). In production, connect this endpoint to your email provider (Resend/SendGrid) to send real reminder emails.


