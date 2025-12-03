/**
 * E2E Test Utilities
 * Provides helpers for testing Gatherly flows
 */

import { supabase } from '@/integrations/supabase/client';
import { createLogger, trackAnalytics, getAnalyticsQueue, clearAnalyticsQueue } from './logger';

const logger = createLogger('test-utils');

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
}

// Test runner
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - start;
    logger.info(`✓ ${name} passed`, { duration });
    return { name, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`✗ ${name} failed`, error);
    return { name, passed: false, duration, error: errorMessage };
  }
}

// Test suite runner
export async function runTestSuite(
  name: string,
  tests: Array<{ name: string; fn: () => Promise<void> }>
): Promise<TestSuite> {
  logger.info(`Running test suite: ${name}`);
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    results.push(result);
  }
  
  const suite: TestSuite = {
    name,
    results,
    totalPassed: results.filter(r => r.passed).length,
    totalFailed: results.filter(r => !r.passed).length,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
  };
  
  logger.info(`Suite "${name}" completed`, {
    passed: suite.totalPassed,
    failed: suite.totalFailed,
    duration: suite.totalDuration,
  });
  
  return suite;
}

// ====== TEST CASES ======

// Test: Event join flow
export async function testJoinEventFlow(eventId: string): Promise<TestSuite> {
  clearAnalyticsQueue();
  
  return runTestSuite('Join Event Flow', [
    {
      name: 'Fetch event details',
      fn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, starts_at, freeze_hours_before')
          .eq('id', eventId)
          .single();
        
        if (error || !data) throw new Error('Event not found');
        trackAnalytics('test_event_fetched', { eventId });
      },
    },
    {
      name: 'Check freeze status',
      fn: async () => {
        const { data } = await supabase
          .from('events')
          .select('starts_at, freeze_hours_before')
          .eq('id', eventId)
          .single();
        
        if (!data) throw new Error('Event not found');
        
        const startsAt = new Date(data.starts_at);
        const freezeHours = data.freeze_hours_before || 24;
        const freezeTime = new Date(startsAt.getTime() - freezeHours * 60 * 60 * 1000);
        const isFrozen = new Date() >= freezeTime;
        
        trackAnalytics('test_freeze_checked', { eventId, isFrozen });
      },
    },
    {
      name: 'Verify analytics events tracked',
      fn: async () => {
        const queue = getAnalyticsQueue();
        if (queue.length < 2) {
          throw new Error(`Expected at least 2 analytics events, got ${queue.length}`);
        }
      },
    },
  ]);
}

// Test: Group chat flow
export async function testGroupChatFlow(groupId: string): Promise<TestSuite> {
  return runTestSuite('Group Chat Flow', [
    {
      name: 'Fetch group info',
      fn: async () => {
        const { data, error } = await supabase
          .from('micro_groups')
          .select('id, frozen, status')
          .eq('id', groupId)
          .single();
        
        if (error || !data) throw new Error('Group not found');
      },
    },
    {
      name: 'Fetch messages',
      fn: async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, created_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
      },
    },
    {
      name: 'Check mute status',
      fn: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) {
          logger.info('Skipping mute check - no user session');
          return;
        }
        
        const { error } = await supabase
          .from('user_mutes')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', session.session.user.id)
          .gt('muted_until', new Date().toISOString())
          .maybeSingle();
        
        if (error) throw new Error(`Failed to check mute status: ${error.message}`);
      },
    },
  ]);
}

// Test: Attendance check-in flow
export async function testAttendanceFlow(eventId: string): Promise<TestSuite> {
  return runTestSuite('Attendance Flow', [
    {
      name: 'Verify event exists',
      fn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('id, title')
          .eq('id', eventId)
          .single();
        
        if (error || !data) throw new Error('Event not found');
      },
    },
    {
      name: 'Check attendance window',
      fn: async () => {
        const { data } = await supabase
          .from('events')
          .select('starts_at, ends_at')
          .eq('id', eventId)
          .single();
        
        if (!data) throw new Error('Event not found');
        
        const now = new Date();
        const startsAt = new Date(data.starts_at);
        const endsAt = data.ends_at ? new Date(data.ends_at) : new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
        
        const windowStart = new Date(startsAt.getTime() - 60 * 60 * 1000); // 1 hour before
        const windowEnd = endsAt;
        
        const inWindow = now >= windowStart && now <= windowEnd;
        trackAnalytics('test_attendance_window', { eventId, inWindow });
      },
    },
  ]);
}

// Test: Permission enforcement
export async function testPermissions(orgId: string): Promise<TestSuite> {
  return runTestSuite('Permission Enforcement', [
    {
      name: 'Verify org exists',
      fn: async () => {
        const { data, error } = await supabase
          .from('orgs')
          .select('id, name')
          .eq('id', orgId)
          .single();
        
        if (error || !data) throw new Error('Org not found');
      },
    },
    {
      name: 'Check user role',
      fn: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user) {
          logger.info('Skipping role check - no user session');
          return;
        }
        
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('org_id', orgId)
          .eq('user_id', session.session.user.id)
          .maybeSingle();
        
        trackAnalytics('test_role_checked', { orgId, role: data?.role || 'none' });
      },
    },
  ]);
}

// Run all tests
export async function runAllTests(params: {
  eventId?: string;
  groupId?: string;
  orgId?: string;
}): Promise<TestSuite[]> {
  const suites: TestSuite[] = [];
  
  if (params.eventId) {
    suites.push(await testJoinEventFlow(params.eventId));
    suites.push(await testAttendanceFlow(params.eventId));
  }
  
  if (params.groupId) {
    suites.push(await testGroupChatFlow(params.groupId));
  }
  
  if (params.orgId) {
    suites.push(await testPermissions(params.orgId));
  }
  
  // Summary
  const totalPassed = suites.reduce((sum, s) => sum + s.totalPassed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.totalFailed, 0);
  
  logger.info('=== All Tests Complete ===', {
    suites: suites.length,
    totalPassed,
    totalFailed,
  });
  
  return suites;
}
