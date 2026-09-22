// Integracion con el boton de pago de Naranja X.
//
// Flujo: la tienda crea el cobro, redirige al cliente a la pagina de pago de Naranja X y, al volver
// (o cuando llega el webhook), consulta el estado del cobro para marcar el pedido como pagado.
//
// Naranja X entrega la documentacion de su API recien al adherir el comercio, asi que las llamadas
// reales (createRemoteCheckout / getRemotePaymentStatus) quedan pendientes de completar con esos datos.
// Mientras tanto, NX_SIMULATE=true permite probar el flujo completo localmente.

export type NaranjaXPaymentStatus = "approved" | "pending" | "rejected";

export type NaranjaXCheckout = {
  paymentId: string;
  checkoutUrl: string;
};

type CreateCheckoutInput = {
  orderId: string;
  totalCents: number;
  description: string;
  payerEmail: string;
};

export function isNaranjaXSimulated(): boolean {
  return process.env.NX_SIMULATE === "true";
}

export function isNaranjaXConfigured(): boolean {
  return isNaranjaXSimulated() || Boolean(process.env.NX_API_KEY);
}

function clientUrl(): string {
  return process.env.CLIENT_URL ?? "http://localhost:5173";
}

export async function createCheckout(input: CreateCheckoutInput): Promise<NaranjaXCheckout> {
  if (isNaranjaXSimulated()) {
    return {
      paymentId: `SIMULATED-${input.orderId}`,
      checkoutUrl: `${clientUrl()}/pago-simulado/${input.orderId}`,
    };
  }
  return createRemoteCheckout(input);
}

export async function getPaymentStatus(paymentId: string): Promise<NaranjaXPaymentStatus> {
  if (isNaranjaXSimulated()) {
    // En modo simulado el estado lo define el endpoint /api/payments/simulate.
    return "pending";
  }
  return getRemotePaymentStatus(paymentId);
}

// TODO(Naranja X): completar con la API real cuando Naranja X entregue la documentacion.
// Debe crear el cobro por `totalCents / 100` ARS con `external_reference = orderId`, configurar como
// URL de retorno `${clientUrl()}/orders/${orderId}` y como webhook `<URL publica del server>/api/payments/webhook`.
async function createRemoteCheckout(_input: CreateCheckoutInput): Promise<NaranjaXCheckout> {
  throw new Error("La integracion con la API de Naranja X todavia no esta completa (falta la documentacion oficial)");
}

// TODO(Naranja X): consultar el estado del cobro y traducirlo a approved / pending / rejected.
async function getRemotePaymentStatus(_paymentId: string): Promise<NaranjaXPaymentStatus> {
  throw new Error("La integracion con la API de Naranja X todavia no esta completa (falta la documentacion oficial)");
}
