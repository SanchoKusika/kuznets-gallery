import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";

export function generateStaticParams() {
  return getCatalog().map((p) => ({ code: p.slug }));
}

// Stage 3: artwork page.
export default async function WorkPage({ params }: PageProps<"/work/[code]">) {
  const { code } = await params;
  if (!getCatalog().some((p) => p.slug === code.toLowerCase())) notFound();
  return <main />;
}
