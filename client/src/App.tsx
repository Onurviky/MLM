import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Products } from "@/pages/Products";
import { ProductDetail } from "@/pages/ProductDetail";
import { Contact } from "@/pages/Contact";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { OrderConfirmation } from "@/pages/OrderConfirmation";
import { OrderHistory } from "@/pages/OrderHistory";
import { AccountSettings } from "@/pages/AccountSettings";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { NotFound } from "@/pages/NotFound";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminProductForm } from "@/pages/admin/AdminProductForm";
import { AdminCollections } from "@/pages/admin/AdminCollections";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminCoupons } from "@/pages/admin/AdminCoupons";
import { AdminShipping } from "@/pages/admin/AdminShipping";
import { AdminSettings } from "@/pages/admin/AdminSettings";

export function App() {
  return (
    <Routes>
      <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      <Route path="/admin/products/:id" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      <Route path="/admin/collections" element={<AdminRoute><AdminCollections /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
      <Route path="/admin/shipping" element={<AdminRoute><AdminShipping /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/account/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
