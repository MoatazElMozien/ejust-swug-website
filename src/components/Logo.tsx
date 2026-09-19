import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", sub = "SolidWorks User Group" }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="E-JUST SWUG home">
      <Image src="/assets/images/logo.png" alt="" width={40} height={40} className="size-9 object-contain" priority />
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-semibold tracking-wide">E-JUST SWUG</span>
        <span className="block text-[11px] text-muted">{sub}</span>
      </span>
    </Link>
  );
}
