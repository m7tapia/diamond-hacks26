import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ masterToken: string }> }
) {
  try {
    const { masterToken } = await params;

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, master_token, created_at')
      .eq('master_token', masterToken)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: alerts, error: alertsErr } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (alertsErr) {
      return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
    }

    return NextResponse.json({ user, alerts: alerts ?? [] });
  } catch (e) {
    console.error('/api/manage error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
