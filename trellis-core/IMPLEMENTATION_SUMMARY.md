# Trellis Core - Engineering Implementation Summary

## What Has Been Built

This repository contains the complete technical foundation for **Trellis** (or **Crux**), a student operating system that combines life management with AI-powered learning synthesis.

## Files Delivered

### 1. `schema.sql` - Complete Database Architecture
- **6 normalized tables**: users, materials, jobs, notes, decks, cards, events
- **Row Level Security (RLS)**: Full security policies for multi-tenant isolation
- **Realtime enabled**: Tables configured for Supabase Realtime WebSocket subscriptions
- **3 PostgreSQL functions**:
  - `append_job_log()`: Atomic log appending for Artisan progress tracking
  - `get_due_cards()`: FSRS-based card retrieval for review sessions
  - `review_card()`: Simplified FSRS algorithm for scheduling updates
- **Performance indexes**: Optimized queries for user-specific data and due cards
- **Automatic triggers**: `updated_at` timestamp management

### 2. `main.py` - Local AI Bridge (FastAPI Server)
- **Webhook receiver**: Accepts POST from Supabase Storage on file upload
- **Background task processing**: Non-blocking job execution
- **PDF text extraction**: Using PyPDF2 for material parsing
- **LLM integration**: Ollama API for local LLM inference (qwen2.5:14b)
- **Structured output generation**: JSON parsing for outlines, flashcards, MCQs
- **Supabase writes**: Direct database updates using service role key
- **Security**: Bearer token authentication for webhook endpoint
- **Health check endpoint**: For Cloudflare Tunnel monitoring

### 3. `ArtisanTracker.tsx` - React Component for Real-time Progress
- **Supabase Realtime subscription**: WebSocket-based live updates
- **Terminal-style UI**: Animated log display with timestamps
- **Status indicators**: Queued → Processing → Completed/Failed states
- **Progress bar**: Visual feedback based on log count
- **Completion handling**: Callback when synthesis finishes
- **Responsive design**: Tailwind CSS styling with dark theme
- **Connection status**: Live indicator for realtime connection

### 4. `README.md` - Complete Documentation
- Architecture diagrams
- Tech stack overview
- Quick start guide
- Environment setup instructions
- API documentation
- Troubleshooting section

### 5. `requirements.txt` - Python Dependencies
- FastAPI, uvicorn, supabase-py, pypdf, ollama, pydantic, httpx

### 6. `.env.example` - Environment Template
- Supabase credentials
- Webhook secret
- Ollama configuration

## Architecture Highlights

### Push-Based Design (Zero Polling)
```
User Upload → Supabase Storage → Webhook → Cloudflare Tunnel → Local FastAPI → Ollama LLM
                                      ↓
                              Supabase Realtime ← Frontend WebSocket
```

**Benefits:**
- No rate limit issues from polling
- Instant progress updates (<100ms latency)
- Zero infrastructure costs (no AWS Lambda, no serverless functions)
- Secure outbound-only tunnel (no port forwarding)

### FSRS Integration
The schema includes all fields required for the FSRS-6 spaced repetition algorithm:
- `stability`: How stable the memory is (days until forgetting)
- `difficulty`: Card difficulty (1-10 scale)
- `elapsed_days`: Days since last review
- `scheduled_days`: Days until next review
- `reps`: Successful consecutive recalls
- `lapses`: Times forgotten
- `state`: New, Learning, Review, or Relearning

### Security Model
1. **RLS Policies**: Users can only access their own data
2. **Service Role Key**: Kept in backend (FastAPI), never exposed to frontend
3. **Bearer Token Auth**: Webhook endpoint requires secret token
4. **Cloudflare Tunnel**: Encrypted HTTPS, no open ports on local machine

## Next Engineering Steps

### Immediate (Day 1-2)
1. **Run schema.sql** in Supabase SQL Editor
2. **Create Storage Bucket** named `materials` with RLS policies
3. **Install dependencies**: `pip install -r requirements.txt`
4. **Test locally**: Start FastAPI server without tunnel first

### Short-term (Week 1)
1. **Cloudflare Tunnel Setup**: 
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
2. **Configure Webhook**: Point Supabase Storage webhook to tunnel URL
3. **Test End-to-End**: Upload PDF → Verify logs appear in ArtisanTracker
4. **Integrate Ollama**: Ensure local LLM is running (`ollama run qwen2.5:14b`)

### Medium-term (Month 1)
1. **Full FSRS-6 Port**: Integrate official Rust/Python FSRS library
2. **Semantic Answer Grading**: Add embedding model for fuzzy answer matching
3. **Block Editor Integration**: TipTap or BlockNote for note-taking
4. **Calendar Sync**: ICS import + auto-scheduler logic
5. **Mobile App**: React Native / Expo for iOS/Android

### Long-term (Quarter 1-2)
1. **Multi-user Queue System**: Priority queues for paid vs free users
2. **Analytics Dashboard**: Study time tracking, retention curves
3. **Collaborative Features**: Shared decks, study groups
4. **API Public Release**: Allow third-party integrations

## Technical Decisions & Trade-offs

### Why Local LLM Instead of Cloud API?
- **Privacy**: Student data never leaves their machine
- **Cost**: €0 inference vs $0.01-0.10 per request
- **Control**: Fine-tune models for educational content
- **Offline Capability**: Works without internet after initial setup

**Trade-off**: Requires user to have decent GPU (8GB+ VRAM recommended)

### Why Cloudflare Tunnels Instead of ngrok?
- **Free tier**: Unlimited bandwidth (ngrok limits to 40GB/month)
- **Persistent URLs**: Can use custom domains
- **No auth redirects**: Direct HTTP POST support
- **Open source**: Transparent security model

### Why Supabase Instead of Self-hosted Postgres?
- **Built-in Realtime**: No need to manage WebSocket servers
- **Auth included**: Email/password, OAuth, magic links out of box
- **Storage integrated**: S3-compatible with RLS
- **Edge Functions**: JavaScript/TypeScript serverless when needed

**Trade-off**: Vendor lock-in, but can migrate via standard PostgreSQL dump

### Why JSONB for progress_logs Instead of Separate Table?
- **Simpler queries**: Single table read for entire job state
- **Atomic updates**: PostgreSQL's `||` operator for array append
- **Realtime efficiency**: One WebSocket event contains full state

**Trade-off**: Less queryable individual logs (acceptable for this use case)

## Performance Considerations

### Database
- Indexes on `user_id` + `status` for fast job queries
- Partial index on `due_at WHERE state != 'New'` for card reviews
- RLS policies push down to row-level for security + performance

### Network
- Cloudflare Tunnel adds ~20-50ms latency (acceptable for async jobs)
- Webhook payload <1KB (minimal bandwidth)
- File downloads use Supabase CDN (fast globally)

### LLM Inference
- qwen2.5:14b requires ~10GB VRAM, processes ~50 tokens/sec
- For 50-page PDF: ~2-3 minutes total synthesis time
- Can upgrade to 32B/70B models if hardware allows

## Monitoring & Observability

Add these to production:

1. **Job Metrics**: Track queue depth, processing time, failure rate
2. **LLM Health**: Monitor Ollama API response times
3. **Tunnel Status**: Alert if Cloudflare Tunnel disconnects
4. **Database**: Supabase dashboard shows query performance

Example logging addition to `main.py`:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trellis-artisan")

# In process_artisan_job:
logger.info(f"Starting job {job_id} for material {material_id}")
```

## Support & Contribution

See README.md for setup instructions and troubleshooting.

For questions about:
- **Database schema**: Check `schema.sql` comments
- **FastAPI server**: See `main.py` docstrings
- **Frontend component**: Review `ArtisanTracker.tsx` props
- **Architecture**: Refer to diagrams in README.md

---

**Built with**: Supabase, FastAPI, Next.js, Ollama, Cloudflare Tunnels, FSRS

**License**: MIT
