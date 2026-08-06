/**
 * Test script for magister-sync Edge Function
 * 
 * Run locally with:
 * supabase functions serve magister-sync
 * 
 * Then in another terminal:
 * deno run --allow-net test.ts
 */

const FUNCTION_URL = 'http://localhost:54321/functions/v1/magister-sync';
// Or use deployed URL:
// const FUNCTION_URL = 'https://zbppznuwwcjdbdbkexyq.supabase.co/functions/v1/magister-sync';

// Replace with an actual sync_token from your database
const TEST_SYNC_TOKEN = 'YOUR_SYNC_TOKEN_HERE';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  response?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<TestResult>) {
  console.log(`\n🧪 Running: ${name}`);
  try {
    const result = await testFn();
    results.push(result);
    console.log(result.passed ? '✅ PASSED' : '❌ FAILED', result.message);
    if (result.response) {
      console.log('Response:', JSON.stringify(result.response, null, 2));
    }
  } catch (error) {
    results.push({ name, passed: false, message: error.message });
    console.log('❌ FAILED', error.message);
  }
}

// Test 1: Missing sync token
await runTest('Missing sync token should return 401', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiType: 'CALENDAR',
      data: { Items: [] }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Missing sync token',
    passed: response.status === 401,
    message: `Expected 401, got ${response.status}`,
    response: data
  };
});

// Test 2: Invalid sync token
await runTest('Invalid sync token should return 401', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': '00000000-0000-0000-0000-000000000000'
    },
    body: JSON.stringify({
      apiType: 'CALENDAR',
      data: { Items: [] }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Invalid sync token',
    passed: response.status === 401,
    message: `Expected 401, got ${response.status}`,
    response: data
  };
});

// Test 3: Empty calendar data (valid token required)
await runTest('Empty calendar data should succeed', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': TEST_SYNC_TOKEN
    },
    body: JSON.stringify({
      apiType: 'CALENDAR',
      data: { Items: [] }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Empty calendar data',
    passed: response.status === 200 && data.success === true,
    message: response.status === 401 
      ? 'Update TEST_SYNC_TOKEN with a valid token'
      : `Expected 200, got ${response.status}`,
    response: data
  };
});

// Test 4: Calendar data with one event
await runTest('Calendar sync with one event', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': TEST_SYNC_TOKEN
    },
    body: JSON.stringify({
      apiType: 'CALENDAR',
      data: {
        Items: [
          {
            Id: 999999,
            Start: '2026-08-05T09:00:00.000+02:00',
            Einde: '2026-08-05T10:00:00.000+02:00',
            Omschrijving: 'Test Wiskunde Les',
            Lokatie: 'Lokaal 101'
          }
        ]
      }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Calendar sync',
    passed: response.status === 200 && data.inserted > 0,
    message: response.status === 401 
      ? 'Update TEST_SYNC_TOKEN with a valid token'
      : `Expected inserted > 0, got ${data.inserted}`,
    response: data
  };
});

// Test 5: Empty grades data
await runTest('Empty grades data should succeed', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': TEST_SYNC_TOKEN
    },
    body: JSON.stringify({
      apiType: 'GRADES',
      data: { items: [] }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Empty grades data',
    passed: response.status === 200 && data.success === true,
    message: response.status === 401 
      ? 'Update TEST_SYNC_TOKEN with a valid token'
      : `Expected 200, got ${response.status}`,
    response: data
  };
});

// Test 6: Grades data with one grade
await runTest('Grades sync with one grade', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': TEST_SYNC_TOKEN
    },
    body: JSON.stringify({
      apiType: 'GRADES',
      data: {
        items: [
          {
            CijferId: 888888,
            Vak: 'Nederlands',
            Omschrijving: 'Proefwerk spelling',
            Cijfer: '7.5',
            Weging: 2,
            Datum: '2025-10-15T00:00:00.000+02:00',
            Periode: 2
          }
        ]
      }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Grades sync',
    passed: response.status === 200 && data.inserted > 0,
    message: response.status === 401 
      ? 'Update TEST_SYNC_TOKEN with a valid token'
      : `Expected inserted > 0, got ${data.inserted}`,
    response: data
  };
});

// Test 7: Unknown API type
await runTest('Unknown API type should return 400', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'sync-token': TEST_SYNC_TOKEN
    },
    body: JSON.stringify({
      apiType: 'UNKNOWN',
      data: { items: [] }
    })
  });
  
  const data = await response.json();
  
  return {
    name: 'Unknown API type',
    passed: response.status === 400,
    message: `Expected 400, got ${response.status}`,
    response: data
  };
});

// Test 8: CORS preflight (OPTIONS request)
await runTest('CORS preflight should return 200', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS',
    headers: { 
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,sync-token'
    }
  });
  
  return {
    name: 'CORS preflight',
    passed: response.status === 200,
    message: `Expected 200, got ${response.status}`,
    response: {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    }
  };
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`Total: ${results.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Review the output above.');
  console.log('\nNote: Tests requiring a valid sync_token will fail if TEST_SYNC_TOKEN is not set.');
}

// Exit with appropriate code
Deno.exit(failed > 0 ? 1 : 0);
