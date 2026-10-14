import { CollectionFiltersProvider } from "@/features/catalog/filters";

export default function CollectionLayout({ children }: LayoutProps<"/collection">) {
  return <CollectionFiltersProvider>{children}</CollectionFiltersProvider>;
}
