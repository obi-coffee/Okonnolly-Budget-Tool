import ScrollAnimation from './ScrollAnimation';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <ScrollAnimation className="text-center max-w-4xl mx-auto">
        <h1 className="mb-8">
          <span className="block font-mono font-bold uppercase text-tast-pink text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-tight">
            YOUR COFFEE
          </span>
          <span className="block font-serif italic text-rich-black text-[clamp(1.5rem,4vw,3rem)] leading-tight mt-2">
            deserves to be
          </span>
          <span className="block font-mono font-bold uppercase text-tast-pink text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-tight">
            FOUND.
          </span>
        </h1>
      </ScrollAnimation>

      <ScrollAnimation className="max-w-xl mx-auto mt-8">
        <div className="bg-tast-pink text-white p-8 md:p-10">
          <p className="font-mono text-sm uppercase tracking-widest mb-3 opacity-80">
            (tāst) platform.
          </p>
          <p className="font-serif text-lg md:text-xl leading-relaxed">
            A specialty coffee discovery app connecting roasters with the people
            who&apos;ll love their beans most.
          </p>
        </div>
      </ScrollAnimation>

      <ScrollAnimation className="mt-12 text-center">
        <a
          href="#apply"
          className="inline-block font-mono text-sm uppercase tracking-wider text-rich-black border-b-2 border-rich-black pb-1 hover:text-tast-pink hover:border-tast-pink transition-colors duration-200"
        >
          Become a Founding Partner
        </a>
      </ScrollAnimation>

      <div className="mt-16 animate-bounce opacity-40" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
