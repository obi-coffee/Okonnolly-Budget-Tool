import ScrollAnimation from './ScrollAnimation';

export default function ClosingCTA() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollAnimation>
          <p className="font-serif text-[clamp(1.75rem,4vw,3.5rem)] leading-snug mb-10">
            Your beans. Their palates.
            <br />
            <span className="text-tast-pink italic">We&apos;ll make the introduction.</span>
          </p>
          <a
            href="#apply"
            className="inline-block px-10 py-4 bg-tast-pink text-white font-mono text-sm uppercase tracking-widest hover:bg-tast-red transition-colors duration-200"
          >
            Apply Now
          </a>
        </ScrollAnimation>
      </div>
    </section>
  );
}
