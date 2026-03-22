import ScrollAnimation from './ScrollAnimation';

const benefits = [
  '12 months free on any paid tier (15% commission waived)',
  'Priority placement during launch period',
  'Direct input on product features',
  'Founding Partner badge — permanent, like the first edition of a great book',
];

const timeline = [
  { date: 'MAY 2026', label: 'Partner Onboarding', desc: 'Profiles set up, products listed' },
  { date: 'JUL 2026', label: 'Beta Launch', desc: '500 users, first ratings & reviews' },
  { date: 'OCT 2026', label: 'Public Launch', desc: '50 VRPs, App Store release, marketing push' },
  { date: 'DEC 2026', label: 'Scale', desc: '100K users, 100 VRPs, first consumer intelligence reports' },
];

export default function DeeperValue() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation>
          <p className="font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] text-center leading-snug max-w-3xl mx-auto mb-24">
            We&apos;re building the definitive platform for specialty coffee discovery.
            And we want you to help shape it.
          </p>
        </ScrollAnimation>

        {/* Founding Partner Benefits */}
        <ScrollAnimation>
          <div className="mb-24">
            <h3 className="font-mono font-bold uppercase text-tast-pink text-sm tracking-widest mb-10 text-center">
              Founding Partner Benefits
            </h3>
            <div className="space-y-6 max-w-2xl mx-auto">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="font-mono text-tast-pink text-sm mt-0.5 shrink-0">0{i + 1}</span>
                  <p className="font-body text-rich-black text-lg leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Timeline */}
        <ScrollAnimation>
          <div>
            <h3 className="font-mono font-bold uppercase text-tast-pink text-sm tracking-widest mb-12 text-center">
              The Timeline
            </h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7rem] md:left-[9rem] top-0 bottom-0 w-px bg-rich-black/10 hidden sm:block" aria-hidden="true" />

              <div className="space-y-10">
                {timeline.map((item) => (
                  <div key={item.date} className="flex flex-col sm:flex-row gap-2 sm:gap-8">
                    <div className="sm:w-[9rem] shrink-0 sm:text-right">
                      <span className="font-mono text-tast-pink text-sm font-bold">{item.date}</span>
                    </div>
                    <div className="relative sm:pl-8">
                      <div className="absolute left-0 top-1.5 w-2 h-2 bg-tast-pink rounded-full hidden sm:block" aria-hidden="true" />
                      <p className="font-mono text-xs uppercase tracking-widest text-rich-black mb-1">
                        {item.label}
                      </p>
                      <p className="font-body text-rich-black/70 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
