import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { productCreateSchema } from "@shared/schemas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { useCategories } from "@/hooks/useProducts";
import { useAdminCollections, useAdminProducts, useCreateProduct, useUpdateProduct, useUploadImage } from "@/hooks/useAdmin";

type VariantRow = { size: string; color: string; stock: string; sku: string };

const EMPTY_VARIANT: VariantRow = { size: "", color: "", stock: "0", sku: "" };

export function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories();
  const { data: collectionsData } = useAdminCollections();
  const { data: productsData, isLoading: loadingProducts } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existing = isEdit ? productsData?.items.find((p) => p.id === id) : undefined;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([{ ...EMPTY_VARIANT }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setSlug(existing.slug);
      setDescription(existing.description);
      setPrice(String(existing.priceCents / 100));
      setCompareAtPrice(existing.compareAtPriceCents ? String(existing.compareAtPriceCents / 100) : "");
      setCategoryId(existing.categoryId);
      setCollectionId(existing.collectionId ?? "");
      setFeatured(existing.featured);
      setActive(existing.active);
      setImages(existing.images);
      setVariants(
        existing.variants.map((v) => ({ size: v.size, color: v.color, stock: String(v.stock), sku: v.sku })),
      );
    }
  }, [existing]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      const result = await uploadImage.mutateAsync(file);
      setImages((prev) => [...prev, result.url]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    if (categoriesData?.items.length && !categoryId && !isEdit) {
      setCategoryId(categoriesData.items[0].id);
    }
  }, [categoriesData, categoryId, isEdit]);

  function updateVariant(index: number, key: keyof VariantRow, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      slug,
      description,
      priceCents: Math.round(Number(price) * 100),
      compareAtPriceCents: compareAtPrice.trim() ? Math.round(Number(compareAtPrice) * 100) : null,
      categoryId,
      collectionId: collectionId || null,
      featured,
      active,
      images,
      variants: variants.map((v) => ({ size: v.size, color: v.color, stock: Number(v.stock), sku: v.sku })),
    };

    const result = productCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const normalized = {
      ...result.data,
      compareAtPriceCents: result.data.compareAtPriceCents ?? null,
      collectionId: result.data.collectionId ?? null,
    };

    if (isEdit && id) {
      await updateProduct.mutateAsync({ id, input: normalized });
    } else {
      await createProduct.mutateAsync(normalized);
    }
    navigate("/admin/products");
  }

  if (isEdit && loadingProducts) return <Spinner className="min-h-[60vh]" />;

  return (
    <AdminLayout>
      <h1 className="mb-10 font-heading text-3xl tracking-wide text-ink">
        {isEdit ? "Editar producto" : "Nuevo producto"}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={errors.slug}
          placeholder="hoodie-gothic-oversize"
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-border-strong focus:outline-none"
          />
          {errors.description && <p className="text-xs text-accent-hover">{errors.description}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Precio (ARS)"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={errors.priceCents}
          />
          <Input
            label="Precio anterior (opcional, para mostrar descuento)"
            type="number"
            min="0"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            error={errors.compareAtPriceCents}
            placeholder="Dejar vacio si no hay descuento"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={errors.categoryId}>
            {categoriesData?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Coleccion (opcional)" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            <option value="">Sin coleccion</option>
            {collectionsData?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest2 text-ink-muted">Fotos del producto</p>
          {errors.images && <p className="text-xs text-accent-hover">{errors.images}</p>}
          <div className="flex flex-wrap gap-3">
            {images.map((img, index) => (
              <div key={img + index} className="group relative h-24 w-20 overflow-hidden border border-border">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-bg/80 text-ink opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="product-images"
              onChange={handleImageUpload}
            />
            <label
              htmlFor="product-images"
              className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border-strong text-ink-dim hover:text-ink"
            >
              <Upload className="h-4 w-4" />
              <span className="text-center text-[10px] uppercase tracking-widest2">
                {uploadImage.isPending ? "Subiendo..." : "Subir"}
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-8">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Destacado
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Activo
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">Variantes (talle / color / stock)</p>
            <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          {errors.variants && <p className="text-xs text-accent-hover">{errors.variants}</p>}
          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1.4fr_auto] items-center gap-2">
              <input
                value={variant.size}
                onChange={(e) => updateVariant(index, "size", e.target.value)}
                placeholder="Talle"
                className="h-10 border border-border bg-surface px-3 text-sm text-ink focus:border-border-strong focus:outline-none"
              />
              <input
                value={variant.color}
                onChange={(e) => updateVariant(index, "color", e.target.value)}
                placeholder="Color"
                className="h-10 border border-border bg-surface px-3 text-sm text-ink focus:border-border-strong focus:outline-none"
              />
              <input
                value={variant.stock}
                onChange={(e) => updateVariant(index, "stock", e.target.value)}
                placeholder="Stock"
                type="number"
                min="0"
                className="h-10 border border-border bg-surface px-3 text-sm text-ink focus:border-border-strong focus:outline-none"
              />
              <input
                value={variant.sku}
                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                placeholder="SKU"
                className="h-10 border border-border bg-surface px-3 text-sm text-ink focus:border-border-strong focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
                className="text-ink-dim hover:text-accent-hover disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button type="submit" loading={createProduct.isPending || updateProduct.isPending}>
          {isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </form>
    </AdminLayout>
  );
}
