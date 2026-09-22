import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useCategories, useCollections, useProducts } from "@/hooks/useProducts";
import { Spinner } from "@/components/ui/Spinner";
import { classNames } from "@/lib/utils";
import { ProductGrid } from "./ProductGrid";

export function ProductsSection() {
  const { data: categoriesData } = useCategories();
  const { data: collectionsData } = useCollections();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const collection = params.get("collection") ?? "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useProducts({
    category: category || undefined,
    collection: collection || undefined,
    search: search || undefined,
    page,
  });

  function handleCategoryChange(slug: string) {
    const next = new URLSearchParams(params);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setParams(next);
    setPage(1);
  }

  function handleCollectionChange(slug: string) {
    const next = new URLSearchParams(params);
    if (slug) next.set("collection", slug);
    else next.delete("collection");
    setParams(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <section id="productos" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-4xl tracking-wide text-ink">Archivo</h2>
          <p className="mt-2 text-sm text-ink-muted">{data?.total ?? 0} productos</p>
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar productos..."
            className="h-11 w-full border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-dim focus:border-border-strong focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange("")}
          className={classNames(
            "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
            category === "" ? "border-ink bg-ink text-bg" : "border-border-strong text-ink-muted hover:text-ink",
          )}
        >
          Todo
        </button>
        {categoriesData?.items.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategoryChange(c.slug)}
            className={classNames(
              "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
              category === c.slug ? "border-ink bg-ink text-bg" : "border-border-strong text-ink-muted hover:text-ink",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {collectionsData && collectionsData.items.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-widest2 text-ink-dim">Colecciones</span>
          <button
            onClick={() => handleCollectionChange("")}
            className={classNames(
              "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
              collection === "" ? "border-ink bg-ink text-bg" : "border-border-strong text-ink-muted hover:text-ink",
            )}
          >
            Todas
          </button>
          {collectionsData.items.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCollectionChange(c.slug)}
              className={classNames(
                "border px-4 py-2 text-xs uppercase tracking-widest2 transition-colors",
                collection === c.slug ? "border-ink bg-ink text-bg" : "border-border-strong text-ink-muted hover:text-ink",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className={classNames(isFetching && "opacity-60 transition-opacity")}>
          <ProductGrid products={data?.items ?? []} />

          {data && data.totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={classNames(
                    "flex h-9 w-9 items-center justify-center border text-xs",
                    p === page ? "border-ink bg-ink text-bg" : "border-border-strong text-ink-muted hover:text-ink",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
