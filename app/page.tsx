"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge/Label */}
            <div className="mb-6 inline-flex items-center rounded-full border border-highlight bg-highlight/20 px-4 py-1.5 text-sm font-medium text-secondary">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI Safety & Ethics Insights
            </div>

            {/* Main Headline */}
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl lg:text-6xl">
              Navigate AI&apos;s Ethical Frontier
              <br />
              <span className="text-secondary">Without the Noise</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
              The first newsletter where <span className="font-semibold text-accent">AI curates AI ethics news</span>. Claude Sonnet 4.5 scores articles on relevance, quality, and novelty—then shows you its reasoning. <span className="font-semibold text-primary">5 key insights, twice weekly.</span>
            </p>

            {/* Email Signup Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-5 py-3.5 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-lg bg-accent px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 sm:px-10"
                >
                  {status === "loading" ? "Subscribing..." : "Subscribe Free"}
                </button>
              </div>
              {status === "success" && (
                <p className="mt-3 text-sm text-green-600">✓ Subscribed! Check your inbox.</p>
              )}
              {status === "error" && (
                <p className="mt-3 text-sm text-red-600">✗ Subscription failed. Please try again.</p>
              )}
              <p className="mt-3 text-sm text-text-secondary">
                No spam. 2 emails/week. Unsubscribe anytime.
              </p>
            </form>

            {/* Social Proof */}
            <div className="mt-8 flex items-center gap-2 text-sm text-text-secondary">
              <span>
                Free newsletter • No spam • Unsubscribe anytime
              </span>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-highlight/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>
      </section>

      {/* Content Preview Section */}
      <section className="bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
              What You&apos;ll Discover
            </h2>
            <p className="text-lg text-text-secondary">
              Real stories from the frontlines of AI safety and ethics
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Sample Story Card 1 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                ALIGNMENT
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                Claude Exhibits Alignment Faking in Simulated Training
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                Anthropic researchers discover AI systems can strategically comply during training while preserving misaligned goals...
              </p>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>3 min read</span>
                <span>From: Anthropic</span>
              </div>
            </div>

            {/* Sample Story Card 2 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                SAFETY
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                New Jailbreak Defense Blocks 95% of Attacks
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                MIT researchers develop circuit breaker approach that prevents harmful outputs without sacrificing capabilities...
              </p>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>4 min read</span>
                <span>From: MIT CSAIL</span>
              </div>
            </div>

            {/* Sample Story Card 3 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                POLICY
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                EU AI Act Implementation: What Developers Need to Know
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                New compliance requirements for high-risk AI systems take effect Q1 2025. Here's your action plan...
              </p>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>5 min read</span>
                <span>From: EU Commission</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="#"
              className="inline-flex items-center text-accent hover:text-secondary font-semibold"
            >
              See example issue
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-secondary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-primary">5-Minute Reads</h3>
              <p className="text-sm text-text-secondary">
                Concise summaries of the latest research and developments
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-secondary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-primary">Credible Sources</h3>
              <p className="text-sm text-text-secondary">
                Only peer-reviewed research and official announcements
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-secondary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-primary">AI-Curated</h3>
              <p className="text-sm text-text-secondary">
                Claude scores every article, then humans approve the best
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-secondary">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-primary">Zero Noise</h3>
              <p className="text-sm text-text-secondary">
                No hype, no fluff—only what matters for your work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About / How It Works Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-text-secondary">
              AI-powered curation with transparent reasoning
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-bold text-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-primary">
                  10 Curated Sources, Monitored Daily
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Our system scans research from Anthropic, OpenAI, DeepMind, ArXiv AI Safety, Partnership on AI, LessWrong, and other leading sources. Currently tracking 1,200+ articles.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-bold text-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-primary">
                  Claude Scores Each Article (0-1 Scale)
                </h3>
                <p className="text-text-secondary leading-relaxed mb-3">
                  Claude Sonnet 4.5 evaluates every article across 4 dimensions:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <div className="font-semibold text-primary text-sm">Relevance</div>
                    <div className="text-xs text-text-secondary">AI safety & ethics focus</div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <div className="font-semibold text-primary text-sm">Quality</div>
                    <div className="text-xs text-text-secondary">Credibility & substance</div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <div className="font-semibold text-primary text-sm">Novelty</div>
                    <div className="text-xs text-text-secondary">Newness & significance</div>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <div className="font-semibold text-primary text-sm">Overall</div>
                    <div className="text-xs text-text-secondary">Weighted recommendation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-bold text-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-primary">
                  Human Expert Reviews AI Reasoning
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  We review Claude's top-scored articles and its detailed reasoning. Only the most valuable insights—typically 3-5 articles—make it to your inbox. You see the AI score and reasoning for every article.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white font-bold text-lg">
                  4
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-primary">
                  Delivered Twice Weekly, 5-Minute Read
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Every Monday and Thursday, you get a concise digest with the signal, not the noise. Each article includes Claude's "Why this matters" analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Transparency Note */}
          <div className="mt-12 rounded-xl border-2 border-accent/20 bg-accent/5 p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-primary">
                  Why AI Curation for AI Ethics?
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  We believe in transparency. If AI systems are going to help us understand AI ethics, we should show you exactly how they're thinking. That's why every newsletter includes Claude's scoring and reasoning—so you can judge for yourself whether the AI is making good decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition / Mission Section */}
      <section className="bg-primary px-6 py-16 text-white md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            Built for the AI Safety Community
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-white/90">
            As AI capabilities advance rapidly, staying informed on safety research, alignment breakthroughs, and ethical developments is critical. This newsletter solves the information overload problem through AI-powered curation—with full transparency into how the AI makes decisions.
          </p>
          <div className="grid gap-6 text-left md:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
              <div className="mb-3 text-2xl font-bold text-accent">1,241</div>
              <div className="text-sm text-white/80">Articles tracked from 10 curated sources</div>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
              <div className="mb-3 text-2xl font-bold text-accent">2x Weekly</div>
              <div className="text-sm text-white/80">Monday and Thursday delivery</div>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur">
              <div className="mb-3 text-2xl font-bold text-accent">5 Minutes</div>
              <div className="text-sm text-white/80">Concise, high-signal content</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
            Stay Ahead of the Curve
          </h2>
          <p className="mb-8 text-lg text-text-secondary">
            Join the community shaping AI&apos;s future responsibly
          </p>
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                required
                className="flex-1 rounded-lg border border-gray-300 px-5 py-3.5 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-accent px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              >
                Subscribe Free
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-text-secondary md:flex-row">
            <div>
              <span className="font-semibold text-primary">AI Ethics Newsletter</span> • Curating the signal in AI safety
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
