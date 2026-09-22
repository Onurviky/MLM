import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminProducts, useDeleteProduct, useUpdateProduct } from "@/hooks/useAdmin";
import { formatPrice } from "@/lib/utils";

export function AdminProducts() {
  const { data, isLoading } = useAdminProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <AdminLayout>
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide text-ink">Productos</h1>
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Package} title="Sin productos" description="Crea tu primer producto para empezar a vender." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-widest2 text-ink-dim">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((product) => {
                const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={product.id}>
                    <td className="flex items-center gap-3 px-4 py-3">
                      <img src={product.images[0]} alt="" className="h-10 w-10 object-cover" />
                      <span className="text-ink">{product.name}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{product.category.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatPrice(product.priceCents)}</td>
                    <td className="px-4 py-3 text-ink-muted">{stock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateProduct.mutate({ id: product.id, input: { active: !product.active } })}
                        title={product.active ? "Visible en la tienda: click para desactivar" : "Oculto en la tienda: click para activar"}
                      >
                        <Badge tone={product.active ? "success" : "accent"}>
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/admin/products/${product.id}`} className="text-ink-muted hover:text-ink">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {confirmId === product.id ? (
                          <button
                            onClick={() => {
                              deleteProduct.mutate(product.id);
                              setConfirmId(null);
                            }}
                            className="text-xs text-accent-hover underline"
                          >
                            Confirmar
                          </button>
                        ) : (
                          <button onClick={() => setConfirmId(product.id)} className="text-ink-muted hover:text-accent-hover">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
