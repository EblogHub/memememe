import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import PendingVerificationPage from "./pages/PendingVerificationPage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import SiteInfoPage from "./pages/SiteInfoPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function RouteLoading() {
  return <main className="route-loading"><span className="loading-mark">a</span><p>Opening your campus…</p></main>;
}

function VerifiedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (!user.isVerified || user.accountStatus !== "APPROVED") return <Navigate to="/pending-verification" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <RouteLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to={user.isVerified ? "/marketplace" : "/pending-verification"} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pending-verification" element={<PendingVerificationPage />} />
      <Route path="/marketplace" element={<VerifiedRoute><MarketplacePage /></VerifiedRoute>} />
      <Route path="/products/:productId" element={<VerifiedRoute><ProductPage /></VerifiedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/legal/:slug" element={<SiteInfoPage />} />
      <Route path="/community-guidelines" element={<SiteInfoPage />} />
      <Route path="/account-deletion" element={<SiteInfoPage />} />
      <Route path="/how-it-works" element={<SiteInfoPage />} />
      <Route path="/features" element={<SiteInfoPage />} />
      <Route path="/download" element={<SiteInfoPage />} />
      <Route path="/faqs" element={<SiteInfoPage />} />
      <Route path="/about" element={<SiteInfoPage />} />
      <Route path="/contact" element={<SiteInfoPage />} />
      <Route path="/blog" element={<SiteInfoPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
