from fastapi import FastAPI, BackgroundTasks, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from supabase import create_client, Client
import os
import secrets as secrets_module
import json
import time
import requests
from pypdf import PdfReader
import ollama
from typing import Optional, Dict, Any, List

app = FastAPI(title="Trellis Artisan Bridge", version="1.0.0")

# Security
security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class WebhookPayload(BaseModel):
    job_id: str
    material_id: str
    storage_url: str
    requested_outputs: Dict[str, bool]
    custom_prompt: str = ""

def update_job_log(job_id: str, message: str):
    """Atomically append a log message to the job's progress_logs array."""
    timestamp = time.strftime('%H:%M:%S')
    log_entry = f"[{timestamp}] {message}"
    
    # Use PostgreSQL's jsonb_array_append for atomic operation
    result = supabase.rpc(
        'append_job_log',
        {'job_id_param': job_id, 'log_entry': log_entry}
    ).execute()
    
    # Update status to processing if not already completed/failed
    supabase.table("jobs").update({
        "status": "processing",
        "updated_at": "now()"
    }).eq("id", job_id).eq("status", "queued").execute()

def download_from_supabase(storage_url: str) -> bytes:
    """Download file from Supabase Storage using signed URL or service key."""
    # Extract bucket and path from storage_url
    # Format: s3://bucket/path or /bucket/path
    parts = storage_url.strip('/').split('/')
    bucket = parts[0]
    path = '/'.join(parts[1:])
    
    response = supabase.storage.from_(bucket).download(path)
    return response

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using PyPDF2 or pdfplumber."""
    from io import BytesIO
    pdf_file = BytesIO(file_content)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def generate_artisan_output(text: str, requested_outputs: Dict[str, bool], custom_prompt: str) -> Dict[str, Any]:
    """Generate structured output using local LLM."""
    
    output_sections = []
    if requested_outputs.get('outline'):
        output_sections.append('Structured Outline')
    if requested_outputs.get('cards'):
        output_sections.append('FSRS Flashcards')
    if requested_outputs.get('mcq'):
        output_sections.append('Multiple Choice Questions')
    if requested_outputs.get('summary'):
        output_sections.append('Feynman Summary')
    
    prompt = f"""You are an expert educational content synthesizer. Analyze the following text and generate the requested outputs.

TEXT TO ANALYZE:
{text[:15000]}  # Limit context window

REQUESTED OUTPUTS:
{', '.join(output_sections)}

CUSTOM INSTRUCTIONS:
{custom_prompt if custom_prompt else "None - follow standard educational best practices"}

OUTPUT FORMAT (strict JSON):
{{
  "outline": [array of nested strings for hierarchical outline],
  "cards": [{{"front": "question", "back": "answer"}}],
  "mcqs": [{{"question": "...", "options": ["a", "b", "c", "d"], "correct": 0}}],
  "summary": "concise feynman-style explanation"
}}

Only return valid JSON. No markdown, no explanations."""

    try:
        response = ollama.chat(model='qwen2.5:14b', messages=[
            {'role': 'system', 'content': 'You are a precise educational AI that outputs only valid JSON.'},
            {'role': 'user', 'content': prompt}
        ])
        
        # Parse JSON from response
        content = response['message']['content']
        # Remove markdown code blocks if present
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        
        return json.loads(content.strip())
    except Exception as e:
        raise Exception(f"LLM generation failed: {str(e)}")

def process_artisan_job(payload: WebhookPayload):
    """Background task to process an Artisan job."""
    job_id = payload.job_id
    
    try:
        # Stage 1: Download
        update_job_log(job_id, "Connecting to secure storage...")
        update_job_log(job_id, f"Downloading material: {payload.storage_url}")
        
        file_content = download_from_supabase(payload.storage_url)
        file_size_mb = len(file_content) / (1024 * 1024)
        update_job_log(job_id, f"Downloaded {file_size_mb:.1f} MB")
        
        # Stage 2: Extract
        update_job_log(job_id, "Extracting text and mapping structure...")
        
        if payload.storage_url.endswith('.pdf'):
            text = extract_text_from_pdf(file_content)
        else:
            text = file_content.decode('utf-8', errors='ignore')
        
        page_count = text.count('\n') // 30  # Rough estimate
        update_job_log(job_id, f"Extracted text (~{page_count} pages)")
        
        # Stage 3: Synthesize
        update_job_log(job_id, "Synthesizing core axioms...")
        time.sleep(1)  # Allow UI to update
        
        update_job_log(job_id, "Forging active recall prompts...")
        result = generate_artisan_output(text, payload.requested_outputs, payload.custom_prompt)
        
        # Stage 4: Calibrate
        update_job_log(job_id, "Calibrating FSRS difficulty weights...")
        
        # Apply default FSRS parameters to new cards
        if 'cards' in result:
            for card in result['cards']:
                card['stability'] = 0.0
                card['difficulty'] = 0.5  # Default starting difficulty
                card['state'] = 'New'
        
        time.sleep(1)
        
        # Stage 5: Save Results
        update_job_log(job_id, "Injecting into knowledge vault...")
        
        # Save generated notes if outline exists
        if result.get('outline'):
            supabase.table('notes').insert({
                'user_id': payload.material_id,  # Should be user_id from job lookup
                'material_id': payload.material_id,
                'title': f"Auto-generated outline",
                'content': {'type': 'doc', 'content': [{'type': 'outline', 'attrs': {'data': result['outline']}}]}
            }).execute()
        
        # Save generated cards if any
        if result.get('cards'):
            # Get or create default deck
            deck_result = supabase.table('decks').select('id').eq('user_id', payload.material_id).limit(1).execute()
            if deck_result.data:
                deck_id = deck_result.data[0]['id']
            else:
                deck_result = supabase.table('decks').insert({
                    'user_id': payload.material_id,
                    'name': 'Auto-generated Deck'
                }).execute()
                deck_id = deck_result.data[0]['id']
            
            # Insert cards
            cards_to_insert = [{
                'deck_id': deck_id,
                'front': card['front'],
                'back': card['back'],
                'stability': card.get('stability', 0),
                'difficulty': card.get('difficulty', 0.5),
                'state': 'New'
            } for card in result['cards']]
            
            supabase.table('cards').insert(cards_to_insert).execute()
        
        # Finalize job
        supabase.table("jobs").update({
            "status": "completed",
            "result_payload": result,
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        
        update_job_log(job_id, "✓ Synthesis complete. Ready for review.")
        
    except Exception as e:
        error_msg = f"FATAL ERROR: {str(e)}"
        print(error_msg)
        supabase.table("jobs").update({
            "status": "failed",
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        update_job_log(job_id, error_msg)

@app.post("/webhook")
async def receive_webhook(
    payload: WebhookPayload,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Receive webhook from Supabase and queue job for processing."""
    # Validate Bearer token
    expected_token = os.getenv("WEBHOOK_SECRET")
    if not expected_token:
        raise HTTPException(status_code=503, detail="Webhook authentication is not configured")
    if not secrets_module.compare_digest(credentials.credentials, expected_token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Verify job exists and is in queued state
    job = supabase.table("jobs").select("*").eq("id", payload.job_id).eq("status", "queued").execute()
    if not job.data:
        raise HTTPException(status_code=400, detail="Job not found or already processed")
    
    # Queue background task
    background_tasks.add_task(process_artisan_job, payload)
    
    return {"status": "accepted", "job_id": payload.job_id}

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloudflare Tunnel."""
    return {"status": "healthy", "service": "trellis-artisan-bridge"}

# RPC function for atomic log appending (should be created in SQL first)
# CREATE OR REPLACE FUNCTION append_job_log(job_id_param uuid, log_entry text)
# RETURNS void AS $$
# BEGIN
#   UPDATE jobs 
#   SET progress_logs = progress_logs || to_jsonb(array[log_entry])
#   WHERE id = job_id_param;
# END;
# $$ LANGUAGE plpgsql;
