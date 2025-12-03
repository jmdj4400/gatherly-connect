import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  title: string;
  start_time: string;
  end_time?: string;
  venue_name: string;
  address?: string;
  city?: string;
  category?: string;
  description?: string;
  lat?: string;
  lng?: string;
  price?: string;
  image_url?: string;
}

interface ValidationResult {
  row: number;
  status: 'ok' | 'error' | 'duplicate';
  error_reason?: string;
  data?: CSVRow;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

function normalizeString(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function generateDuplicateHash(title: string, startTime: string, venueName: string): string {
  const normalized = `${normalizeString(title)}|${new Date(startTime).toISOString()}|${normalizeString(venueName)}`;
  // Simple hash for deduplication
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function validateRow(row: CSVRow, rowNum: number): ValidationResult {
  // Required fields
  if (!row.title?.trim()) {
    return { row: rowNum, status: 'error', error_reason: 'Missing required field: title' };
  }
  if (!row.start_time?.trim()) {
    return { row: rowNum, status: 'error', error_reason: 'Missing required field: start_time' };
  }
  if (!row.venue_name?.trim()) {
    return { row: rowNum, status: 'error', error_reason: 'Missing required field: venue_name' };
  }
  
  // Validate date format
  const startDate = new Date(row.start_time);
  if (isNaN(startDate.getTime())) {
    return { row: rowNum, status: 'error', error_reason: 'Invalid start_time format. Use ISO 8601 or common date format.' };
  }
  
  // Validate end_time if provided
  if (row.end_time?.trim()) {
    const endDate = new Date(row.end_time);
    if (isNaN(endDate.getTime())) {
      return { row: rowNum, status: 'error', error_reason: 'Invalid end_time format' };
    }
    if (endDate <= startDate) {
      return { row: rowNum, status: 'error', error_reason: 'end_time must be after start_time' };
    }
  }
  
  // Validate coordinates if provided
  if (row.lat && row.lng) {
    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return { row: rowNum, status: 'error', error_reason: 'Invalid latitude (must be -90 to 90)' };
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return { row: rowNum, status: 'error', error_reason: 'Invalid longitude (must be -180 to 180)' };
    }
  }
  
  // Validate price if provided
  if (row.price?.trim()) {
    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
      return { row: rowNum, status: 'error', error_reason: 'Invalid price (must be a positive number)' };
    }
  }
  
  return { row: rowNum, status: 'ok', data: row };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dry_run') === 'true';
    const orgId = url.searchParams.get('org_id');
    
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user and verify org_admin role
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check org_admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'org_admin')
      .eq('org_id', orgId)
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Not authorized as org admin for this organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body (CSV content)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const filename = formData.get('filename') as string || 'import.csv';
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No CSV file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid rows found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[csv-import] Processing ${rows.length} rows, dry_run=${dryRun}`);

    // Get existing events for duplicate detection
    const { data: existingEvents } = await supabaseAdmin
      .from('events')
      .select('id, title, starts_at, venue_name')
      .eq('host_org_id', orgId);

    const existingHashes = new Set(
      (existingEvents || []).map(e => 
        generateDuplicateHash(e.title, e.starts_at, e.venue_name || '')
      )
    );

    // Validate all rows
    const results: ValidationResult[] = [];
    const validRows: { data: CSVRow; hash: string }[] = [];
    const seenHashes = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i], i + 2); // +2 for 1-indexed + header row
      
      if (validation.status === 'ok' && validation.data) {
        const hash = generateDuplicateHash(
          validation.data.title,
          validation.data.start_time,
          validation.data.venue_name
        );
        
        if (existingHashes.has(hash)) {
          results.push({ row: i + 2, status: 'duplicate', error_reason: 'Event already exists (same title, start time, venue)' });
        } else if (seenHashes.has(hash)) {
          results.push({ row: i + 2, status: 'duplicate', error_reason: 'Duplicate row in this import' });
        } else {
          seenHashes.add(hash);
          validRows.push({ data: validation.data, hash });
          results.push(validation);
        }
      } else {
        results.push(validation);
      }
    }

    const summary = {
      total_rows: rows.length,
      valid: validRows.length,
      errors: results.filter(r => r.status === 'error').length,
      duplicates: results.filter(r => r.status === 'duplicate').length,
    };

    console.log(`[csv-import] Validation: ${summary.valid} valid, ${summary.errors} errors, ${summary.duplicates} duplicates`);
    console.log(`[analytics] event_import_run: org_id=${orgId}, dry_run=${dryRun}, rows=${rows.length}`);

    if (dryRun) {
      // Return preview without committing
      return new Response(JSON.stringify({
        dry_run: true,
        summary,
        results: results.slice(0, 100), // Limit preview to first 100 rows
        preview: validRows.slice(0, 10).map(r => r.data)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Commit: Create import batch and events
    if (validRows.length === 0) {
      return new Response(JSON.stringify({
        error: 'No valid rows to import',
        summary,
        results
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create import batch
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('import_batches')
      .insert({
        org_id: orgId,
        filename,
        row_count: rows.length,
        success_count: validRows.length,
        error_count: summary.errors + summary.duplicates,
        status: 'committed'
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error('[csv-import] Batch creation error:', batchError);
      return new Response(JSON.stringify({ error: 'Failed to create import batch' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert events
    const eventsToInsert = validRows.map(({ data }) => ({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      venue_name: data.venue_name.trim(),
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      category: data.category?.trim() || null,
      starts_at: new Date(data.start_time).toISOString(),
      ends_at: data.end_time ? new Date(data.end_time).toISOString() : null,
      lat: data.lat ? parseFloat(data.lat) : null,
      lng: data.lng ? parseFloat(data.lng) : null,
      ticket_price: data.price ? parseFloat(data.price) : 0,
      image_url: data.image_url?.trim() || null,
      host_org_id: orgId,
      source: 'csv',
      import_batch_id: batch.id
    }));

    const { error: insertError } = await supabaseAdmin
      .from('events')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('[csv-import] Events insert error:', insertError);
      // Rollback: update batch status
      await supabaseAdmin
        .from('import_batches')
        .update({ status: 'rolled_back' })
        .eq('id', batch.id);
      
      return new Response(JSON.stringify({ error: 'Failed to insert events', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[csv-import] Successfully imported ${validRows.length} events, batch_id=${batch.id}`);
    if (summary.errors > 0) {
      console.log(`[analytics] import_rows_failed: org_id=${orgId}, count=${summary.errors}`);
    }

    return new Response(JSON.stringify({
      success: true,
      batch_id: batch.id,
      summary,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[csv-import] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
