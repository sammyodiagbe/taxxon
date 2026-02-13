'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  const features = [
    'T4, T5, T4A, T4E slips',
    'RRSP contributions',
    'Charitable donations',
    'Medical expenses',
    'Home office deductions',
    'Tuition credits',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">Taxxon</span>
            </div>
            <div className="flex items-center gap-6">
              <Button onClick={handleGetStarted} size="sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-neutral-500 mb-4">
            2024 Tax Year
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            Canadian tax filing,
            <br />
            simplified.
          </h1>
          <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
            File your taxes in minutes. Enter your slips, add your deductions,
            and submit directly to CRA. Free and secure.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Button size="lg" onClick={handleGetStarted}>
              Start Filing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-sm font-medium text-neutral-500 mb-8">
            Supported tax slips & deductions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-neutral-900"
              >
                <Check className="h-4 w-4 text-neutral-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-sm font-medium text-neutral-500 mb-12">
            How it works
          </h2>
          <div className="grid gap-12 sm:grid-cols-3">
            <div>
              <div className="text-3xl font-light text-neutral-300 mb-4">01</div>
              <h3 className="font-medium text-black mb-2">Enter your information</h3>
              <p className="text-sm text-neutral-600">
                Add your personal details and enter your tax slips as they appear.
              </p>
            </div>
            <div>
              <div className="text-3xl font-light text-neutral-300 mb-4">02</div>
              <h3 className="font-medium text-black mb-2">Add deductions</h3>
              <p className="text-sm text-neutral-600">
                Include RRSP contributions, donations, medical expenses, and more.
              </p>
            </div>
            <div>
              <div className="text-3xl font-light text-neutral-300 mb-4">03</div>
              <h3 className="font-medium text-black mb-2">Review and submit</h3>
              <p className="text-sm text-neutral-600">
                Review your return, see your refund, and file with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-black">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-xl font-medium text-white">Ready to file?</h2>
              <p className="text-neutral-400 mt-1">Get started in under a minute.</p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-black hover:bg-neutral-100"
            >
              Start Filing
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Taxxon
          </p>
        </div>
      </footer>
    </div>
  );
}
