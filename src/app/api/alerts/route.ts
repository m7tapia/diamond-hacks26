import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateToken } from '@/lib/tokens';
import { CreateAlertSchema } from '@/lib/validators';
import { scheduleAlert } from '@/lib/scheduler';
import { INTERVAL_MS } from '@/lib/constants';
import { AlertInterval } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { master_token, item, location, radius_miles, interval } = parsed.data;

    // Resolve user from master_token
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('master_token', master_token)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alert_token = generateToken();
    const now = new Date();
    const next_run_at = new Date(now.getTime() + INTERVAL_MS[interval as AlertInterval]);

    const { data: alert, error: alertErr } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        alert_token,
        item,
        location,
        radius_miles,
        interval,
        status: 'active',
        next_run_at: next_run_at.toISOString(),
      })
      .select()
      .single();

    if (alertErr || !alert) {
      console.error('Failed to create alert:', alertErr);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    // Schedule the alert
    scheduleAlert(alert.id, interval as AlertInterval);

    // Fire first run immediately in background
    console.log(`[api/alerts] 🤖 Launching agents for first run of alert ${alert.id}`);
    import('@/lib/pipeline').then(({ runAlertPipeline }) => {
      runAlertPipeline(alert.id).catch((e) =>
        console.error('First run failed for alert', alert.id, e)
      );
    });

    return NextResponse.json({ 
      alert,
      message: 'Alert created! Our AI agents are searching marketplaces now. You\'ll receive an email in 2-3 minutes with the best deals.'
    }, { status: 201 });
  } catch (e) {
    console.error('/api/alerts POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
