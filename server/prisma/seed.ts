import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function placeholder(label: string, tone: "dark" | "light" = "dark"): string {
  const bg = tone === "dark" ? "#0a0a0a" : "#efeee9";
  const fg = tone === "dark" ? "#f5f5f2" : "#0a0a0a";
  const line = tone === "dark" ? "rgba(245,245,242,0.14)" : "rgba(10,10,10,0.14)";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125">
    <rect width="900" height="1125" fill="${bg}"/>
    <rect x="24" y="24" width="852" height="1077" fill="none" stroke="${line}" stroke-width="1"/>
    <text x="450" y="540" font-family="Georgia, serif" font-size="120" fill="${fg}" text-anchor="middle" opacity="0.9">MLM</text>
    <text x="450" y="610" font-family="Arial, sans-serif" font-size="26" letter-spacing="6" fill="${fg}" text-anchor="middle" opacity="0.6">${label.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("admin1234", 10);
  const customerPassword = await bcrypt.hash("cliente1234", 10);

  await prisma.user.create({
    data: {
      email: "admin@mlm.com",
      passwordHash: adminPassword,
      name: "MLM Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "cliente@mlm.com",
      passwordHash: customerPassword,
      name: "Cliente Demo",
      role: "CUSTOMER",
    },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Hoodies", slug: "hoodies" } }),
    prisma.category.create({ data: { name: "Remeras", slug: "remeras" } }),
    prisma.category.create({ data: { name: "Pantalones", slug: "pantalones" } }),
    prisma.category.create({ data: { name: "Accesorios", slug: "accesorios" } }),
  ]);

  const [hoodies, remeras, pantalones, accesorios] = categories;
  const SIZES = ["S", "M", "L", "XL"];

  type Seed = {
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    compareAtPriceCents?: number;
    categoryId: string;
    featured: boolean;
    color: string;
    images?: string[];
  };

  const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

  const products: Seed[] = [
    {
      name: "Hoodie Gothic Oversize",
      slug: "hoodie-gothic-oversize",
      description:
        "Hoodie oversize en algodon pesado 400gsm con logo bordado en blackletter sobre pecho. Calce holgado, capucha doble tela, bolsillo canguro reforzado.",
      priceCents: 8500000,
      compareAtPriceCents: 10500000,
      categoryId: hoodies.id,
      featured: true,
      color: "Negro",
      images: [pexels(28701960), pexels(15127546)],
    },
    {
      name: "Hoodie Zip Heavyweight",
      slug: "hoodie-zip-heavyweight",
      description:
        "Buzo con cierre completo, friza cepillada interior, cordones planos y detalle de logo grabado en cierre metalico.",
      priceCents: 9200000,
      categoryId: hoodies.id,
      featured: true,
      color: "Negro",
      images: [pexels(6310980), pexels(14241847)],
    },
    {
      name: "Remera Blackletter Tee",
      slug: "remera-blackletter-tee",
      description:
        "Remera de algodon peinado 220gsm, estampa blackletter en pecho, calce boxy fit y bordes reforzados.",
      priceCents: 3800000,
      categoryId: remeras.id,
      featured: true,
      color: "Negro",
    },
    {
      name: "Remera Essential Mono",
      slug: "remera-essential-mono",
      description: "Remera basica premium, tela pesada, logo pequeno bordado en manga.",
      priceCents: 3200000,
      categoryId: remeras.id,
      featured: false,
      color: "Blanco",
    },
    {
      name: "Cargo Pant Utility",
      slug: "cargo-pant-utility",
      description: "Pantalon cargo con bolsillos utilitarios, tiro medio, gabardina resistente al desgaste.",
      priceCents: 7600000,
      categoryId: pantalones.id,
      featured: true,
      color: "Negro",
    },
    {
      name: "Sweatpant Relaxed",
      slug: "sweatpant-relaxed",
      description: "Jogger de friza pesada, calce relajado, puno y cintura elastizada con cordon.",
      priceCents: 6400000,
      categoryId: pantalones.id,
      featured: false,
      color: "Gris",
    },
    {
      name: "Gorra Gothic Emblem",
      slug: "gorra-gothic-emblem",
      description: "Gorra six panel con logo bordado en 3D, visera curva, cierre metalico ajustable.",
      priceCents: 2500000,
      categoryId: accesorios.id,
      featured: false,
      color: "Negro",
    },
    {
      name: "Beanie Ribbed",
      slug: "beanie-ribbed",
      description: "Gorro de punto acanalado, logo tejido, calce ajustado unisex.",
      priceCents: 1800000,
      categoryId: accesorios.id,
      featured: false,
      color: "Negro",
    },
  ];

  for (const p of products) {
    const images = p.images ?? [placeholder(p.name, "dark"), placeholder(p.name, "light")];
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        compareAtPriceCents: p.compareAtPriceCents ?? null,
        categoryId: p.categoryId,
        featured: p.featured,
        active: true,
        images: JSON.stringify(images),
        variants: {
          create: SIZES.map((size) => ({
            size,
            color: p.color,
            stock: Math.floor(Math.random() * 15) + 5,
            sku: `${p.slug}-${size}`.toUpperCase(),
          })),
        },
      },
    });
  }

  await prisma.coupon.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.shippingMethod.deleteMany();

  await prisma.coupon.create({
    data: { code: "BIENVENIDO10", type: "PERCENT", value: 10, minPurchaseCents: 0 },
  });
  await prisma.coupon.create({
    data: { code: "ENVIOGRATIS", type: "FREE_SHIPPING", value: 0, minPurchaseCents: 5000000 },
  });
  await prisma.coupon.create({
    data: { code: "MLM5000", type: "FIXED", value: 500000, minPurchaseCents: 3000000 },
  });

  await prisma.storeSettings.create({
    data: {
      id: "singleton",
      maxInstallments: 12,
      freeShippingThresholdCents: 10000000,
      whatsappPhone: "5491122334455",
      bankAlias: "mlm.store.mp",
      bankAccountHolder: "MLM Store SRL",
    },
  });

  await prisma.shippingMethod.create({
    data: { name: "Cadeteria (zona centrica)", description: "Entrega en 24-48hs habiles", priceCents: 150000, sortOrder: 0 },
  });
  await prisma.shippingMethod.create({
    data: {
      name: "Correo Argentino a sucursal",
      description: "Retiras en la sucursal que elijas, 3-5 dias habiles",
      priceCents: 250000,
      sortOrder: 1,
    },
  });
  await prisma.shippingMethod.create({
    data: {
      name: "Coordinar por WhatsApp",
      description: "Te contactamos para acordar el envio y el costo",
      priceCents: 0,
      sortOrder: 2,
    },
  });

  console.log("Seed completo.");
  console.log("Admin: admin@mlm.com / admin1234");
  console.log("Cliente: cliente@mlm.com / cliente1234");
  console.log("Cupones: BIENVENIDO10 (10%), ENVIOGRATIS, MLM5000 ($5000 off)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
