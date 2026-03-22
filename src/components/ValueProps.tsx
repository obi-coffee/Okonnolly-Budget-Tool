import ScrollAnimation from './ScrollAnimation';

const props = [
  {
    title: 'QUALIFIED DISCOVERY',
    body: 'Users who find you on tāst already have taste profiles that match your coffee. These aren\u2019t random browsers\u200A\u2014\u200Athey\u2019re predisposed to love what you roast.',
  },
  {
    title: 'YOUR STOREFRONT',
    body: 'A beautiful roaster profile with your story, sourcing philosophy, and full product line. Something you control and own.',
  },
  {
    title: 'CONSUMER INTELLIGENCE',
    body: 'See how your coffees perform. Which flavor profiles resonate. What equipment your customers use. Insights you can\u2019t get anywhere else.',
  },
  {
    title: '88\u201392% OF EVERY SALE',
    body: 'Stays with you. Compare that to 40\u201360% through traditional wholesale channels.',
  },
];

export default function ValueProps() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-5xl mx-auto">
        <ScrollAnimation>
          <h2 className="font-serif text-[clamp(1.5rem,4vw,3rem)] text-center leading-snug max-w-3xl mx-auto mb-20">
            What&apos;s good for the marketplace is good for the market.
          </h2>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {props.map((prop) => (
            <ScrollAnimation key={prop.title}>
              <div>
                <h3 className="font-mono font-bold uppercase text-tast-pink text-sm tracking-widest mb-4">
                  {prop.title}
                </h3>
                <p className="font-body text-rich-black text-base leading-relaxed">
                  {prop.body}
                </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
