import Link from 'next/link';

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; status?: string }>;
}) {
  return (
    <UnsubscribedContent searchParams={searchParams} />
  );
}

async function UnsubscribedContent({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; status?: string }>;
}) {
  const { item, status } = await searchParams;

  if (status === 'notfound') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Link not found</h1>
          <p className="text-zinc-400">This unsubscribe link may have already been used.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Done — you&apos;re unsubscribed
        </h1>
        <p className="text-zinc-400 mb-6">
          {item
            ? `You've been unsubscribed from "${decodeURIComponent(item)}" alerts. All your other alerts continue running.`
            : 'The alert has been cancelled.'}
        </p>
        <Link
          href="/"
          className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4"
        >
          ← Back to Market-Alchemy
        </Link>
      </div>
    </main>
  );
}
