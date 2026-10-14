import { notFound } from "next/navigation";
import { CATS } from "@/content/site";

export function generateStaticParams() {
  return [{ category: [] }, ...CATS.map((c) => ({ category: [c.k] }))];
}

// Stage 3: collection grid, filters, list view.
export default async function CollectionPage({ params }: PageProps<"/collection/[[...category]]">) {
  const { category } = await params;
  if (category && (category.length > 1 || !CATS.some((c) => c.k === category[0]))) notFound();
  return <main />;
}
