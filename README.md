# GridGuard

GridGuard is a Next.js system for AI-assisted traffic incident verification and staff budget approval.

## Features

- Citizen upload page with image evidence, issue details, and Google Maps incident pinning
- Auto pin using current location with latitude and longitude capture
- Dummy AI triage output for urgency, hazard type, route impact, and suggested budget
- Staff dashboard for total budget overview, AI proposed allocations, and approval actions

## Environment Setup

Create or update `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

Enable these APIs in Google Cloud for the key:

- Maps JavaScript API
- Geolocation API (browser-side location permission still required)

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Main Routes

- `/` - GridGuard upload intake page
- `/dashboard/staff` - GridGuard staff budget approval dashboard
