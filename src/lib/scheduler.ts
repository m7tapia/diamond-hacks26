import cron, { ScheduledTask } from 'node-cron';
import { INTERVAL_CRON } from './constants';
import { AlertInterval } from '@/types';

const jobs = new Map<string, ScheduledTask>();

export function scheduleAlert(alertId: string, interval: AlertInterval) {
  // Cancel existing job if any
  cancelAlert(alertId);

  const cronExpr = INTERVAL_CRON[interval];

  const task = cron.schedule(cronExpr, async () => {
    console.log(`[scheduler] Firing alert ${alertId}`);
    try {
      const { runAlertPipeline } = await import('./pipeline');
      await runAlertPipeline(alertId);
    } catch (e) {
      console.error(`[scheduler] Error running alert ${alertId}:`, e);
    }
  });

  jobs.set(alertId, task);
  console.log(`[scheduler] Scheduled alert ${alertId} with interval ${interval} (${cronExpr})`);
}

export function pauseAlert(alertId: string) {
  jobs.get(alertId)?.stop();
  console.log(`[scheduler] Paused alert ${alertId}`);
}

export function resumeAlert(alertId: string) {
  jobs.get(alertId)?.start();
  console.log(`[scheduler] Resumed alert ${alertId}`);
}

export function cancelAlert(alertId: string) {
  const job = jobs.get(alertId);
  if (job) {
    job.stop();
    jobs.delete(alertId);
    console.log(`[scheduler] Cancelled alert ${alertId}`);
  }
}

export async function bootstrapScheduler() {
  console.log('[scheduler] Bootstrapping — loading active alerts from DB...');
  try {
    const { supabase } = await import('./supabase');
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('id, interval')
      .eq('status', 'active');

    if (error) {
      console.error('[scheduler] Failed to load alerts:', error);
      return;
    }

    for (const alert of alerts ?? []) {
      scheduleAlert(alert.id, alert.interval as AlertInterval);
    }

    console.log(`[scheduler] Scheduled ${alerts?.length ?? 0} active alerts`);
  } catch (e) {
    console.error('[scheduler] Bootstrap error:', e);
  }
}
