import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductsSection } from "@/components/product/ProductsSection";
import { useFeaturedProducts } from "@/hooks/useProducts";

export function Home() {
  const { data, isLoading } = useFeaturedProducts();

  function scrollToFeatured() {
    document.getElementById("destacados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <section className="noise-overlay relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden border-b border-border bg-bg px-6 text-center">
        <p className="animate-fade-up text-xs uppercase tracking-widest3 text-ink-dim">Coleccion permanente</p>
        <h1 className="animate-fade-up mt-6 font-display text-[5.5rem] leading-none text-ink sm:text-[8rem] md:text-[10rem] [animation-delay:100ms]">
          MLM
        </h1>
        <p className="animate-fade-up mt-6 max-w-md text-sm text-ink-muted [animation-delay:200ms]">
          Cortes pesados, negro sobre negro y un solo emblema. Ropa hecha para quedarse.
        </p>
        <div className="animate-fade-up mt-10 [animation-delay:300ms]">
          <Button size="lg" onClick={scrollToFeatured}>
            Ver coleccion
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <button
          onClick={scrollToFeatured}
          aria-label="Bajar a destacados"
          className="animate-bounce-down absolute bottom-8 text-ink-dim transition-colors hover:text-ink"
        >
          <ChevronDown className="h-6 w-6" strokeWidth={1.25} />
        </button>
      </section>

      <section id="destacados" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12">
          <h2 className="font-heading text-4xl tracking-wide text-ink">Destacados</h2>
        </div>
        {isLoading ? <Spinner /> : <ProductGrid products={data?.items ?? []} />}
      </section>

      <div className="border-t border-border">
        <ProductsSection />
      </div>

      <section className="border-y border-border bg-surface px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-heading text-3xl leading-tight tracking-wide text-ink sm:text-5xl">
            Sin logos gritados. Sin temporadas. Solo la marca, bordada, en negro.
          </p>
        </div>
      </section>
    </div>
  );
}
