/**
 * Popup Script - Handles user configuration
 */

const SUPABASE_URL = 'https://zbppznuwwcjdbdbkexyq.supabase.co';

// DOM elements
const syncTokenInput = document.getElementById('syncToken');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const successMessage = document.getElementById('successMessage');

// Load saved configuration on popup open
async function loadConfiguration() {
  const result = await chrome.storage.local.get(['sync_token', 'user_id']);
  
  if (result.sync_token) {
    syncTokenInput.value = result.sync_token;
    updateStatus(true, result.user_id);
  }
}

// Save configuration
saveBtn.addEventListener('click', async () => {
  const syncToken = syncTokenInput.value.trim();
  
  if (!syncToken) {
    alert('Please enter a sync token');
    return;
  }
  
  // Validate sync token format (should be a UUID)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(syncToken)) {
    alert('Invalid sync token format. Should be a UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)');
    return;
  }
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Validating...';
  
  try {
    // Validate token by calling Supabase RPC function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_user_id_from_sync_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': syncToken,
        'Authorization': `Bearer ${syncToken}`
      },
      body: JSON.stringify({ token: syncToken })
    });
    
    if (!response.ok) {
      throw new Error(`Validation failed: ${response.status}`);
    }
    
    const userId = await response.json();
    
    if (!userId) {
      throw new Error('Invalid sync token - no user found');
    }
    
    // Save to storage
    await chrome.storage.local.set({ 
      sync_token: syncToken,
      user_id: userId
    });
    
    updateStatus(true, userId);
    showSuccess();
    
  } catch (error) {
    console.error('Error validating sync token:', error);
    alert('Failed to validate sync token. Please check the token and try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Configuration';
  }
});

// Clear configuration
clearBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear the configuration?')) {
    await chrome.storage.local.remove(['sync_token', 'user_id']);
    syncTokenInput.value = '';
    updateStatus(false);
    statusText.textContent = 'Configuration cleared';
    setTimeout(() => {
      statusText.textContent = 'Not configured';
    }, 2000);
  }
});

// Update status display
function updateStatus(connected, userId = null) {
  if (connected) {
    statusDiv.className = 'status connected';
    statusText.textContent = `Connected${userId ? ` (User: ${userId.substring(0, 8)}...)` : ''}`;
  } else {
    statusDiv.className = 'status disconnected';
    statusText.textContent = 'Not configured';
  }
}

// Show success message
function showSuccess() {
  successMessage.classList.add('show');
  setTimeout(() => {
    successMessage.classList.remove('show');
  }, 3000);
}

// Initialize
loadConfiguration();
