import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-baseline gap-0.5" aria-label="tāst Coffee home">
      <span className="font-mono font-bold text-tast-pink text-xl tracking-tight">
        tāst
      </span>
      <span className="font-handwritten text-tast-light-pink text-2xl leading-none">
        Coffee
      </span>
    </Link>
  );
}
