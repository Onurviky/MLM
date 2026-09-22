import { ProductsSection } from "@/components/product/ProductsSection";

export function Products() {
  return (
    <div className="animate-page-in">
      <section className="border-b border-border px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest3 text-ink-dim">Coleccion completa</p>
        <h1 className="mt-4 font-heading text-4xl tracking-wide text-ink sm:text-5xl">Productos</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">
          Explora todo el catalogo por categoria o busca lo que estas buscando.
        </p>
      </section>
      <ProductsSection />
    </div>
  );
}
