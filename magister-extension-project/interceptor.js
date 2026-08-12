/**
 * Interceptor Script - Runs in main page context
 * 
 * This script monkey-patches window.fetch to intercept API calls to:
 * - /api/personen/*/afspraken (calendar/agenda)
 * - /api/personen/*/cijfers (grades)
 * 
 * It clones responses, extracts data, and sends to content.js via postMessage
 * without breaking the original web app functionality.
 */

(function() {
  'use strict';
  
  console.log('[Magister Interceptor] Initializing fetch interceptor...');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // API patterns to intercept
  const PATTERNS = {
    CALENDAR: /\/api\/personen\/[^/]+\/afspraken/i,
    GRADES: /\/api\/personen\/[^/]+\/cijfers/i
  };
  
  // Monkey-patch window.fetch
  window.fetch = async function(...args) {
    const [resource, config] = args;
    
    // Get URL string
    let url = '';
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    }
    
    // Check if this is an API we want to intercept
    const isCalendarAPI = PATTERNS.CALENDAR.test(url);
    const isGradesAPI = PATTERNS.GRADES.test(url);
    
    if (!isCalendarAPI && !isGradesAPI) {
      // Not an API we care about, pass through
      return originalFetch.apply(this, args);
    }
    
    console.log(`[Magister Interceptor] Intercepting: ${url}`);
    
    try {
      // Call original fetch
      const response = await originalFetch.apply(this, args);
      
      // Clone the response so we can read it without consuming the original
      const clonedResponse = response.clone();
      
      // Check if response is JSON
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Parse JSON from cloned response
        const data = await clonedResponse.json();
        
        // Determine API type
        const apiType = isCalendarAPI ? 'CALENDAR' : 'GRADES';
        
        // Send to content script via postMessage
        window.postMessage({
          type: 'MAGISTER_API_INTERCEPTED',
          apiType: apiType,
          url: url,
          data: data,
          timestamp: new Date().toISOString()
        }, '*');
        
        console.log(`[Magister Interceptor] Sent ${apiType} data to content script`, data);
      }
      
      // Return the original response (not the clone)
      return response;
      
    } catch (error) {
      console.error('[Magister Interceptor] Error intercepting request:', error);
      // If something goes wrong, still try to make the original request
      return originalFetch.apply(this, args);
    }
  };
  
  // Also intercept XMLHttpRequest as fallback (in case Magister uses it)
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    this._method = method;
    return originalXHROpen.call(this, method, url, ...rest);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._url) {
      const isCalendarAPI = PATTERNS.CALENDAR.test(this._url);
      const isGradesAPI = PATTERNS.GRADES.test(this._url);
      
      if (isCalendarAPI || isGradesAPI) {
        console.log(`[Magister Interceptor] Intercepting XHR: ${this._url}`);
        
        // Listen for response
        this.addEventListener('load', function() {
          try {
            if (this.responseType === '' || this.responseType === 'text' || this.responseType === 'json') {
              const data = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
              const apiType = isCalendarAPI ? 'CALENDAR' : 'GRADES';
              
              window.postMessage({
                type: 'MAGISTER_API_INTERCEPTED',
                apiType: apiType,
                url: this._url,
                data: data,
                timestamp: new Date().toISOString()
              }, '*');
              
              console.log(`[Magister Interceptor] Sent ${apiType} data (XHR) to content script`, data);
            }
          } catch (error) {
            console.error('[Magister Interceptor] Error parsing XHR response:', error);
          }
        });
      }
    }
    
    return originalXHRSend.apply(this, args);
  };
  
  console.log('[Magister Interceptor] Fetch and XHR interception active');
  console.log('[Magister Interceptor] Monitoring for:');
  console.log('  - Calendar API: /api/personen/*/afspraken');
  console.log('  - Grades API: /api/personen/*/cijfers');
})();
