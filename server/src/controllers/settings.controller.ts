import type { Request, Response } from "express";
import { prisma } from "../db";
import { isNaranjaXConfigured } from "../lib/naranjax";
import { getStoreSettings } from "../lib/pricing";
import { settingsUpdateSchema } from "../validation";

export async function getPublicSettings(_req: Request, res: Response) {
  const settings = await getStoreSettings();
  res.json({
    maxInstallments: settings.maxInstallments,
    freeShippingThresholdCents: settings.freeShippingThresholdCents,
    naranjaXConfigured: isNaranjaXConfigured(),
    whatsappPhone: settings.whatsappPhone,
    bankAlias: settings.bankAlias,
    bankAccountHolder: settings.bankAccountHolder,
  });
}

export async function adminGetSettings(_req: Request, res: Response) {
  const settings = await getStoreSettings();
  res.json({ item: settings });
}

export async function adminUpdateSettings(req: Request, res: Response) {
  const input = settingsUpdateSchema.parse(req.body);
  await getStoreSettings();

  const settings = await prisma.storeSettings.update({
    where: { id: "singleton" },
    data: {
      maxInstallments: input.maxInstallments,
      freeShippingThresholdCents: input.freeShippingThresholdCents ?? null,
      whatsappPhone: input.whatsappPhone ?? null,
      bankAlias: input.bankAlias ?? null,
      bankAccountHolder: input.bankAccountHolder ?? null,
    },
  });

  res.json({ item: settings });
}
