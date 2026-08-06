/**
 * Content Script - Runs in isolated context
 * 
 * This script:
 * 1. Injects interceptor.js into the main page context
 * 2. Listens for intercepted API data via postMessage
 * 3. Sends data to Supabase backend with sync_token
 */

// Backend configuration
const BACKEND_URL = 'https://zbppznuwwcjdbdbkexyq.supabase.co';
const SYNC_ENDPOINT = `${BACKEND_URL}/functions/v1/magister-sync`;

// Inject the interceptor script into the page context
function injectInterceptor() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
  console.log('[Magister Sync] Interceptor injected');
}

// Listen for messages from the interceptor
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;
  
  // Check if this is a message from our interceptor
  if (event.data && event.data.type === 'MAGISTER_API_INTERCEPTED') {
    console.log('[Magister Sync] Received intercepted data:', event.data.apiType);
    
    try {
      // Get sync_token from storage
      const result = await chrome.storage.local.get(['sync_token', 'user_id']);
      
      if (!result.sync_token || !result.user_id) {
        console.warn('[Magister Sync] No sync token found. Please configure the extension.');
        return;
      }
      
      // Send data to backend
      await sendToBackend(event.data, result.sync_token, result.user_id);
      
    } catch (error) {
      console.error('[Magister Sync] Error processing intercepted data:', error);
    }
  }
});

// Send intercepted data to Supabase Edge Function
async function sendToBackend(interceptedData, syncToken, userId) {
  const { apiType, data, url, timestamp } = interceptedData;
  
  try {
    console.log(`[Magister Sync] Sending ${apiType} data to Edge Function...`);
    
    // Send to Edge Function (it handles validation, formatting, and upsert)
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sync-token': syncToken,
      },
      body: JSON.stringify({
        syncToken: syncToken,
        apiType: apiType,
        data: data,
        url: url,
        timestamp: timestamp
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`[Magister Sync] Edge Function error:`, response.status, errorData);
      
      if (response.status === 401) {
        showNotification('Invalid sync token. Please reconfigure the extension.', 'error');
      } else {
        showNotification(`Failed to sync ${apiType.toLowerCase()}: ${errorData.error}`, 'error');
      }
      return;
    }
    
    const result = await response.json();
    console.log(`[Magister Sync] Edge Function response:`, result);
    
    // Show success notification
    const itemCount = result.inserted || 0;
    if (itemCount > 0) {
      showNotification(`Synced ${itemCount} ${apiType.toLowerCase()} item${itemCount > 1 ? 's' : ''}`);
    } else if (result.skipped > 0) {
      showNotification(`No new ${apiType.toLowerCase()} items to sync`);
    }
    
  } catch (error) {
    console.error('[Magister Sync] Error sending to backend:', error);
    showNotification(`Failed to sync ${apiType.toLowerCase()}: ${error.message}`, 'error');
  }
}

// Show browser notification
function showNotification(message, type = 'success') {
  // Create a temporary visual notification
  const notification = document.createElement('div');
  notification.textContent = `🔄 Magister Sync: ${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Inject the interceptor when the script loads
injectInterceptor();

console.log('[Magister Sync] Content script initialized');
