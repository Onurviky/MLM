import type { Request, Response } from "express";
import { prisma } from "../db";
import { ApiError } from "../utils/ApiError";
import {
  categoryCreateSchema,
  collectionCreateSchema,
  collectionUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
} from "../validation";

const PAGE_SIZE = 12;

function serializeProduct<T extends { images: string }>(product: T) {
  return { ...product, images: JSON.parse(product.images) as string[] };
}

export async function listProducts(req: Request, res: Response) {
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const collection = typeof req.query.collection === "string" ? req.query.collection : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : "newest";
  const page = Math.max(1, Number(req.query.page) || 1);

  const where = {
    active: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(collection ? { collection: { slug: collection } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { priceCents: "asc" as const }
      : sort === "price_desc"
        ? { priceCents: "desc" as const }
        : { createdAt: "desc" as const };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true, collection: true, variants: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    items: items.map(serializeProduct),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function getFeaturedProducts(_req: Request, res: Response) {
  const items = await prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { category: true, collection: true, variants: true },
  });
  res.json({ items: items.map(serializeProduct) });
}

export async function getProductBySlug(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true, collection: true, variants: true },
  });
  if (!product || !product.active) {
    throw new ApiError(404, "Producto no encontrado");
  }
  res.json({ item: serializeProduct(product) });
}

export async function listCategories(_req: Request, res: Response) {
  const items = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ items });
}

export async function listCollections(_req: Request, res: Response) {
  const items = await prisma.collection.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items });
}

export async function adminListProducts(_req: Request, res: Response) {
  const items = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, collection: true, variants: true },
  });
  res.json({ items: items.map(serializeProduct) });
}

export async function adminListCollections(_req: Request, res: Response) {
  const items = await prisma.collection.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items });
}

export async function adminCreateCollection(req: Request, res: Response) {
  const input = collectionCreateSchema.parse(req.body);
  const existing = await prisma.collection.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ApiError(409, "Ya existe una coleccion con ese slug");
  }
  const collection = await prisma.collection.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      image: input.image || null,
      active: input.active ?? true,
    },
  });
  res.status(201).json({ item: collection });
}

export async function adminUpdateCollection(req: Request, res: Response) {
  const input = collectionUpdateSchema.parse(req.body);
  const { id } = req.params;

  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Coleccion no encontrada");
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.image !== undefined ? { image: input.image || null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  res.json({ item: collection });
}

export async function adminDeleteCollection(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.collection.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Coleccion no encontrada");
  }
  await prisma.product.updateMany({ where: { collectionId: id }, data: { collectionId: null } });
  await prisma.collection.delete({ where: { id } });
  res.status(204).send();
}

export async function adminCreateProduct(req: Request, res: Response) {
  const input = productCreateSchema.parse(req.body);

  const existing = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ApiError(409, "Ya existe un producto con ese slug");
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      priceCents: input.priceCents,
      compareAtPriceCents: input.compareAtPriceCents ?? null,
      categoryId: input.categoryId,
      collectionId: input.collectionId ?? null,
      featured: input.featured ?? false,
      active: input.active ?? true,
      images: JSON.stringify(input.images),
      variants: { create: input.variants },
    },
    include: { category: true, collection: true, variants: true },
  });

  res.status(201).json({ item: serializeProduct(product) });
}

export async function adminUpdateProduct(req: Request, res: Response) {
  const input = productUpdateSchema.parse(req.body);
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Producto no encontrado");
  }

  if (input.variants) {
    await prisma.productVariant.deleteMany({ where: { productId: id } });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.compareAtPriceCents !== undefined ? { compareAtPriceCents: input.compareAtPriceCents } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.collectionId !== undefined ? { collectionId: input.collectionId } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.images !== undefined ? { images: JSON.stringify(input.images) } : {}),
      ...(input.variants ? { variants: { create: input.variants } } : {}),
    },
    include: { category: true, collection: true, variants: true },
  });

  res.json({ item: serializeProduct(product) });
}

export async function adminCreateCategory(req: Request, res: Response) {
  const input = categoryCreateSchema.parse(req.body);
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ApiError(409, "Ya existe una categoria con ese slug");
  }
  const category = await prisma.category.create({ data: input });
  res.status(201).json({ item: category });
}

export async function adminDeleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Producto no encontrado");
  }
  await prisma.product.delete({ where: { id } });
  res.status(204).send();
}
