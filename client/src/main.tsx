import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CouponProvider } from "./context/CouponContext";
import { ToastProvider } from "./context/ToastContext";
import { CartFeedbackProvider } from "./context/CartFeedbackContext";
import { queryClient } from "./lib/queryClient";
import "./index.css";

const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (mpPublicKey) {
  initMercadoPago(mpPublicKey, { locale: "es-AR" });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <CouponProvider>
              <CartFeedbackProvider>
                <App />
              </CartFeedbackProvider>
            </CouponProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
