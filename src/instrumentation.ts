export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootstrapScheduler } = await import('./lib/scheduler');
    await bootstrapScheduler();
  }
}
