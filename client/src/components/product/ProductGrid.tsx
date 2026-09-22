import { PackageX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <EmptyState icon={PackageX} title="Sin resultados" description="No encontramos productos con esos filtros." />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
