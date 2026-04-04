import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cancelAlert } from '@/lib/scheduler';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ alertToken: string }> }
) {
  try {
    const { alertToken } = await params;

    const { data: alert, error } = await supabase
      .from('alerts')
      .select('id, item')
      .eq('alert_token', alertToken)
      .single();

    if (error || !alert) {
      return NextResponse.redirect(new URL('/unsubscribed?status=notfound', process.env.APP_BASE_URL));
    }

    await supabase
      .from('alerts')
      .update({ status: 'cancelled' })
      .eq('alert_token', alertToken);

    cancelAlert(alert.id);

    const item = encodeURIComponent(alert.item);
    return NextResponse.redirect(
      new URL(`/unsubscribed?item=${item}`, process.env.APP_BASE_URL)
    );
  } catch (e) {
    console.error('/api/unsubscribe error:', e);
    return NextResponse.redirect(new URL('/unsubscribed?status=error', process.env.APP_BASE_URL));
  }
}
