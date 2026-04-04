import { NextRequest, NextResponse } from 'next/server';
import { runAlertPipeline } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const { alertId } = await req.json();
    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
    }

    console.log(`[trigger] Manually triggering alert ${alertId}`);
    // Run in background — return immediately so the request doesn't time out
    runAlertPipeline(alertId).catch((e) =>
      console.error('[trigger] Pipeline error:', e)
    );

    return NextResponse.json({ message: `Alert ${alertId} triggered. Check server logs.` });
  } catch (e) {
    console.error('/api/cron/trigger error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
