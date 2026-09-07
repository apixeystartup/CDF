# Client Data Fetcher

Search businesses by location and type, export to Excel with real-time data via SerpAPI.

## Features
- Search hospitals, restaurants, schools, etc. by location
- State → City cascading dropdown for all Indian states
- Real phone numbers, websites, and full addresses
- Export results to formatted Excel (.xlsx)
- 40+ business types with multiple search variations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```
SERPAPI_KEY=your_serpapi_key_here
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## API Key
Get free SerpAPI key at https://serpapi.com/ (100 searches/month)

## Deploy to Railway
1. Push to GitHub
2. Connect repo on Railway
3. Add `SERPAPI_KEY` environment variable
4. Deploy
