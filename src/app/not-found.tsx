import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-blueprint grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="label text-brand">Error 404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">This part isn&apos;t in the assembly.</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.</p>
        <Link href="/" className="btn btn-primary mt-8">Back to home</Link>
      </div>
    </div>
  );
}
