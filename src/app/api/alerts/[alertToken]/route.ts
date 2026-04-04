import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UpdateAlertSchema } from '@/lib/validators';
import { scheduleAlert, pauseAlert, resumeAlert, cancelAlert } from '@/lib/scheduler';
import { AlertInterval } from '@/types';

async function getAlert(alertToken: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('alert_token', alertToken)
    .single();
  if (error || !data) return null;
  return data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alertToken: string }> }
) {
  try {
    const { alertToken } = await params;
    const body = await req.json();
    const parsed = UpdateAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const alert = await getAlert(alertToken);
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates = parsed.data;

    const { data: updated, error: updateErr } = await supabase
      .from('alerts')
      .update(updates)
      .eq('alert_token', alertToken)
      .select()
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    // Sync scheduler state
    const newStatus = updates.status ?? alert.status;
    const newInterval = (updates.interval ?? alert.interval) as AlertInterval;

    if (newStatus === 'cancelled') {
      cancelAlert(alert.id);
    } else if (newStatus === 'paused') {
      pauseAlert(alert.id);
    } else if (newStatus === 'active') {
      if (alert.status === 'paused') {
        resumeAlert(alert.id);
      } else {
        scheduleAlert(alert.id, newInterval);
      }
    }

    return NextResponse.json({ alert: updated });
  } catch (e) {
    console.error('/api/alerts PATCH error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ alertToken: string }> }
) {
  try {
    const { alertToken } = await params;
    const alert = await getAlert(alertToken);
    if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await supabase.from('alerts').update({ status: 'cancelled' }).eq('alert_token', alertToken);
    cancelAlert(alert.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('/api/alerts DELETE error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
