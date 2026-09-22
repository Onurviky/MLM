import { useRef, useState, type FormEvent } from "react";
import { Layers, Plus, Trash2, Upload } from "lucide-react";
import { collectionCreateSchema } from "@shared/schemas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  useAdminCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
  useUploadImage,
} from "@/hooks/useAdmin";

export function AdminCollections() {
  const { data, isLoading } = useAdminCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadImage.mutateAsync(file);
    setImage(result.url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = { name, slug, description, image, active: true };
    const result = collectionCreateSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    await createCollection.mutateAsync({
      ...result.data,
      description: result.data.description ?? "",
      image: result.data.image ?? "",
      active: result.data.active ?? true,
    });
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
  }

  return (
    <AdminLayout>
      <h1 className="mb-10 font-heading text-3xl tracking-wide text-ink">Colecciones</h1>

      <form onSubmit={handleSubmit} className="mb-12 grid max-w-3xl gap-5 border border-border p-6 sm:grid-cols-2">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Drop Invierno 26"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={errors.slug}
          placeholder="drop-invierno-26"
        />
        <div className="sm:col-span-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest2 text-ink-muted">Descripcion (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-border-strong focus:outline-none"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs uppercase tracking-widest2 text-ink-muted">Imagen de portada (opcional)</p>
          <div className="flex items-center gap-4">
            {image && <img src={image} alt="" className="h-16 w-16 border border-border object-cover" />}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" id="collection-image" onChange={handleImageChange} />
            <label
              htmlFor="collection-image"
              className="flex cursor-pointer items-center gap-2 border border-border-strong px-4 py-2 text-xs uppercase tracking-widest2 text-ink-muted hover:text-ink"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploadImage.isPending ? "Subiendo..." : "Subir imagen"}
            </label>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" loading={createCollection.isPending}>
            <Plus className="h-4 w-4" />
            Crear coleccion
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Layers} title="Sin colecciones" description="Crea la primera con el formulario de arriba." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest2 text-ink-dim">
              <tr>
                <th className="px-4 py-3">Coleccion</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((collection) => (
                <tr key={collection.id}>
                  <td className="flex items-center gap-3 px-4 py-3">
                    {collection.image ? (
                      <img src={collection.image} alt="" className="h-10 w-10 object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center bg-surface text-ink-dim">
                        <Layers className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="text-ink">{collection.name}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{collection.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateCollection.mutate({ id: collection.id, input: { active: !collection.active } })}
                    >
                      <Badge tone={collection.active ? "success" : "neutral"}>
                        {collection.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {confirmId === collection.id ? (
                      <button
                        onClick={() => {
                          deleteCollection.mutate(collection.id);
                          setConfirmId(null);
                        }}
                        className="text-xs text-accent-hover underline"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button onClick={() => setConfirmId(collection.id)} className="text-ink-muted hover:text-accent-hover">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
