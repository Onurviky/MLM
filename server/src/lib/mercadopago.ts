import { MercadoPagoConfig, Payment } from "mercadopago";

let client: MercadoPagoConfig | null = null;

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function getClient(): MercadoPagoConfig {
  if (!client) {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN no esta configurado");
    }
    client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  }
  return client;
}

export function getPaymentClient(): Payment {
  return new Payment(getClient());
}
