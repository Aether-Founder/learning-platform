# Trellis - Student OS with AI Synthesis

A unified operating system for students that merges Life Management (Calendar, Tasks, Habits) with Deep Learning (FSRS, Notion-style notes, Artisan AI synthesis).

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js 14    │────▶│    Supabase      │────▶│  Cloudflare     │
│   Frontend      │◀────│  (PostgreSQL)    │◀────│    Tunnel       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                        │
         │ Realtime              │ Webhook                │ Secure tunnel
         │ WebSocket             │ POST                   │ to localhost
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  ArtisanTracker │     │ Storage Bucket   │     │   FastAPI       │
│  Component      │     │ (materials)      │     │   Local Bridge  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Ollama LLM    │
                                               │   (qwen2.5:14b) │
                                               └─────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Zustand
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **Local AI Bridge**: FastAPI, Cloudflare Tunnels, PyMuPDF, Ollama
- **State Management**: Zustand

## Core Modules

### Module A: Student OS (Life Management)
- Unified Calendar & Roster Sync (.ics imports)
- Auto-Scheduler (Brain Dump inbox)
- Focus Engine (Pomodoro+ with study analytics)

### Module B: LMS (Knowledge Vault)
- Block-Based Note Editor (TipTap/BlockNote)
- FSRS-6 Engine Implementation
- Semantic Answer Grading (cosine similarity)

### Module C: Artisan AI (Async Synthesis Engine)
- Multi-format input (PDF, DOCX, MP4, YouTube)
- Multiple output vectors (Outline, Flashcards, MCQs, Summaries)
- Real-time progress tracking via Supabase Realtime

## Project Structure

```
trellis-core/
├── schema.sql              # Complete Supabase database schema
├── main.py                 # FastAPI local bridge server
├── ArtisanTracker.tsx      # React component for job progress
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Quick Start

### 1. Database Setup

```bash
# In Supabase SQL Editor, run:
psql -h <your-db-host> -U postgres -d postgres -f schema.sql
```

Or copy-paste `schema.sql` contents into the Supabase Dashboard SQL Editor.

### 2. Configure Supabase Storage

1. Go to **Storage** in Supabase Dashboard
2. Create new bucket named `materials` (private)
3. Add RLS policies (see schema.sql comments)
4. Enable webhooks on INSERT events

### 3. Local AI Bridge Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export WEBHOOK_SECRET="your-secret-token"

# Start Cloudflare Tunnel (in separate terminal)
cloudflared tunnel --url http://localhost:8000

# Copy the generated URL (e.g., https://artisan-random-word.trycloudflare.com)
# and configure it in Supabase Storage webhook settings

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend Integration

```tsx
import ArtisanTracker from './ArtisanTracker';

// In your upload component after creating a job:
<ArtisanTracker 
  jobId={jobId} 
  onComplete={(result) => {
    console.log('Synthesis complete!', result);
    // Navigate to generated notes/cards
  }} 
/>
```

## Environment Variables

```bash
# .env file for main.py
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
WEBHOOK_SECRET=your-webhook-bearer-token

# .env.local for Next.js
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## API Endpoints

### FastAPI Local Bridge

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook` | POST | Receive job from Supabase Storage webhook |
| `/health` | GET | Health check for Cloudflare Tunnel monitoring |

### Webhook Payload Format

```json
{
  "job_id": "uuid",
  "material_id": "uuid",
  "storage_url": "materials/user-id/file.pdf",
  "requested_outputs": {
    "outline": true,
    "cards": true,
    "mcq": false,
    "summary": true
  },
  "custom_prompt": "Focus on cardiovascular system"
}
```

## Database Functions

### `append_job_log(job_id_param uuid, log_entry text)`
Atomically append a log entry to a job's progress_logs array.

### `get_due_cards(user_id_param uuid, limit_count integer)`
Get cards due for review with full FSRS state.

### `review_card(card_id_param uuid, rating integer, review_timestamp timestamptz)`
Update card after review using simplified FSRS algorithm.
- Rating: 1=Again, 2=Hard, 3=Good, 4=Easy

## Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Service Role Key**: Only used in backend (FastAPI), never expose to frontend
3. **Webhook Secret**: Bearer token authentication for webhook endpoint
4. **Cloudflare Tunnel**: Outbound-only connection, no port forwarding needed
5. **Signed URLs**: Generate short-lived signed URLs for file downloads

## FSRS Implementation Notes

The current implementation includes a simplified FSRS algorithm in PostgreSQL. For production use:

1. Port the official [FSRS-6](https://github.com/open-spaced-repetition/fsrs-rs) Rust library
2. Implement in Python using `fsrs` package for the local bridge
3. Store full FSRS parameters per user for personalized scheduling

## Troubleshooting

### Webhook not triggering
- Verify storage bucket webhook is enabled
- Check Cloudflare Tunnel is running and URL is correct
- Ensure webhook has proper Authorization header

### Jobs stuck in "queued" status
- Check FastAPI server logs for errors
- Verify Supabase credentials are correct
- Test `/health` endpoint to confirm tunnel is working

### Realtime updates not appearing
- Confirm `supabase_realtime` publication includes `jobs` table
- Check RLS policies allow authenticated reads
- Verify frontend is using correct anon key

## License

MIT License - See LICENSE file for details

## Contributing

This is an opinionated student OS. Contributions welcome for:
- Full FSRS-6 implementation
- Additional AI output formats
- Calendar integrations (Google Calendar, Outlook)
- Mobile app (React Native / Expo)
