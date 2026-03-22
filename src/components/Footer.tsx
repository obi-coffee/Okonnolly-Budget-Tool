import ScrollAnimation from './ScrollAnimation';

export default function Footer() {
  return (
    <footer className="px-6 pt-16 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Stay in the loop */}
        <ScrollAnimation>
          <div className="text-center mb-16 pb-16 border-b border-rich-black/10">
            <h3 className="font-handwritten text-tast-pink text-3xl md:text-4xl mb-4">
              Stay in the loop.
            </h3>
            <p className="font-body text-rich-black/60 text-sm mb-6">
              Updates on the tāst platform, straight to your inbox.
            </p>
            <a
              href="mailto:hello@tastcoffee.co?subject=Add me to the tāst mailing list"
              className="inline-block font-mono text-sm uppercase tracking-wider text-rich-black border-b border-rich-black pb-0.5 hover:text-tast-pink hover:border-tast-pink transition-colors duration-200"
            >
              hello@tastcoffee.co
            </a>
          </div>
        </ScrollAnimation>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 mb-16 max-w-md mx-auto">
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-rich-black/40 mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://tastcoffee.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-rich-black hover:text-tast-pink transition-colors"
                >
                  tastcoffee.com
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/tastcoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-rich-black hover:text-tast-pink transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-rich-black/40 mb-4">
              Get Help
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@tastcoffee.co"
                  className="font-body text-sm text-rich-black hover:text-tast-pink transition-colors"
                >
                  hello@tastcoffee.co
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom logo and copyright */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-0.5 mb-3 opacity-30">
            <span className="font-mono font-bold text-rich-black text-lg tracking-tight">
              tāst
            </span>
            <span className="font-handwritten text-rich-black text-xl leading-none">
              Coffee
            </span>
          </div>
          <p className="font-body text-xs text-rich-black/40">
            &copy; 2026 In Great Taste, LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
