/**
 * Production Smoke Tests
 * End-to-end flow verification for production deployments
 */

import { supabase } from '@/integrations/supabase/client';
import { createLogger, trackAnalytics } from './logger';

const logger = createLogger('smoke-tests');

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SmokeTestReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: SmokeTestResult[];
}

async function runSmokeTest(
  name: string,
  testFn: () => Promise<Record<string, unknown> | void>
): Promise<SmokeTestResult> {
  const start = Date.now();
  
  try {
    const details = await testFn();
    const duration = Date.now() - start;
    logger.info(`✓ ${name}`, { duration });
    return { name, passed: true, duration, details: details || undefined };
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`✗ ${name}`, error);
    return { name, passed: false, duration, error: errorMessage };
  }
}

// Individual smoke tests
async function testDatabaseConnectivity(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('events').select('id').limit(1);
  if (error) throw new Error(`DB error: ${error.message}`);
  return { recordsFound: data?.length || 0 };
}

async function testAuthService(): Promise<Record<string, unknown>> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Auth error: ${error.message}`);
  return { hasSession: !!session, userId: session?.user?.id };
}

async function testEventsQuery(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, starts_at')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5);
  
  if (error) throw new Error(`Events query error: ${error.message}`);
  return { upcomingEvents: data?.length || 0 };
}

async function testOrgsQuery(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name')
    .limit(5);
  
  if (error) throw new Error(`Orgs query error: ${error.message}`);
  return { orgsFound: data?.length || 0 };
}

async function testProfilesAccess(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (error) throw new Error(`Profiles error: ${error.message}`);
  return { profilesAccessible: true, count: data?.length || 0 };
}

async function testHealthEndpoint(): Promise<Record<string, unknown>> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  const data = await response.json();
  return { status: data.status, latency: data.latency_ms };
}

async function testRealtimeConnection(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Realtime connection timeout'));
    }, 5000);
    
    const channel = supabase.channel('smoke-test');
    
    channel.subscribe((status) => {
      clearTimeout(timeout);
      channel.unsubscribe();
      
      if (status === 'SUBSCRIBED') {
        resolve({ realtimeStatus: 'connected' });
      } else {
        reject(new Error(`Realtime status: ${status}`));
      }
    });
  });
}

// Main smoke test runner
export async function runProductionSmokeTests(): Promise<SmokeTestReport> {
  logger.info('=== Starting Production Smoke Tests ===');
  const startTime = Date.now();
  
  const results: SmokeTestResult[] = [];
  
  // Run all smoke tests
  results.push(await runSmokeTest('Database Connectivity', testDatabaseConnectivity));
  results.push(await runSmokeTest('Auth Service', testAuthService));
  results.push(await runSmokeTest('Events Query', testEventsQuery));
  results.push(await runSmokeTest('Orgs Query', testOrgsQuery));
  results.push(await runSmokeTest('Profiles Access', testProfilesAccess));
  results.push(await runSmokeTest('Health Endpoint', testHealthEndpoint));
  results.push(await runSmokeTest('Realtime Connection', testRealtimeConnection));
  
  const report: SmokeTestReport = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'unknown',
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    duration: Date.now() - startTime,
    results,
  };
  
  // Track analytics
  trackAnalytics('smoke_tests_completed', {
    passed: report.passed,
    failed: report.failed,
    duration: report.duration,
  });
  
  logger.info('=== Smoke Tests Complete ===', {
    passed: report.passed,
    failed: report.failed,
    duration: report.duration,
  });
  
  return report;
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).smokeTests = {
    run: runProductionSmokeTests,
  };
}
