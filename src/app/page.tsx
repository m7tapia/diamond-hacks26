import { RegistrationForm } from '@/components/registration-form';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold text-amber-400 mb-3 tracking-tight">
          Market-Alchemy AI
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Set-it-and-forget-it deal scouting across Facebook Marketplace, OfferUp,
          Craigslist, and eBay. Enter your email to get started — no password needed.
        </p>
      </div>

      {/* Registration card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">Get Started</h2>
        <p className="text-zinc-500 text-sm mb-6">
          New users get a welcome email with your personal alerts link. Returning?
          We&apos;ll send you a sign-in link.
        </p>
        <RegistrationForm />
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl text-center">
        {[
          { icon: '🔍', title: '4 Marketplaces', desc: 'Facebook, OfferUp, Craigslist, and eBay — searched automatically' },
          { icon: '⭐', title: 'Scout Score', desc: 'Every listing scored 0–100 for value and match quality' },
          { icon: '📧', title: 'Email Digests', desc: 'Rich deal emails delivered on your schedule, zero effort' },
        ].map((f) => (
          <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-zinc-100 mb-1">{f.title}</h3>
            <p className="text-zinc-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
