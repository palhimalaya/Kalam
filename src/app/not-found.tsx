import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-xl border border-line bg-elev p-5">
      <h1 className="font-serif text-3xl">Page not found</h1>
      <Link className="mt-4 inline-flex min-h-11 items-center rounded-md border border-line px-3" href="/">
        Home
      </Link>
    </section>
  );
}
