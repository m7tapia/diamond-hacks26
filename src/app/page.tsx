import { RegistrationForm } from '@/components/registration-form';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Navbar */}
    <nav className="w-full flex items-center px-6 py-4 absolute top-0 left-0">
      <span className="text-amber-400 font-bold text-xl">🏆 Belfort Tips</span>
    </nav>

      {/* Hero */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="text-5xl mb-4"></div>
        <h1 className="text-4xl font-bold text-amber-400 mb-3 tracking-tight">
          Flip Earnings Effortlessly
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Stay ahead of the competition by finding timely deals across the web.       
          Set your preferences, and let us do the heavy lifting for you.
        </p>
      </div>

      {/* Registration card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">Get Started</h2>
        <p className="text-zinc-500 text-sm mb-6">
          Choose a professional sign in or sign up experience. Separate flows keep your account secure and easy to use.
        </p>
        <RegistrationForm />
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl text-center">
        {[
          { icon: '🔍', title: 'OfferUp', desc: 'OfferUp searched automatically for the best local deals' },
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
