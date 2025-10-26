import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import PublicRoute from "./components/Auth/PublicRoute";
import RouteLoadingFallback from "./components/RouteLoadingFallback";
import LogoAnimation from "./components/LogoAnimation";
import { useAuth } from "./contexts/AuthContext";
import { PageSpinner } from "./components/LoadingSpinner";
import { monetizationConfig } from "./config/monetization";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Lazy load all page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Auth/Login"));
const GoogleCallback = lazy(() => import("./pages/Auth/GoogleCallback"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const SearchProfiles = lazy(() => import("./pages/SearchProfiles"));
const CreateProfile = lazy(() => import("./pages/Profile/BiodataCreate"));
const UserProfile = lazy(() => import("./pages/Profile/UserProfile"));
const BiodataEdit = lazy(() => import("./pages/Profile/BiodataEdit"));
const BiodataView = lazy(() => import("./pages/Profile/BiodataView"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const CreditsWrapper = lazy(() => import("./components/CreditsWrapper"));
const TransactionsWrapper = lazy(() =>
  import("./components/TransactionsWrapper")
);
const AllOrdersWrapper = lazy(() => import("./components/AllOrdersWrapper"));
const MyUnlocks = lazy(() => import("./pages/MyUnlocks"));

// Admin Protected Route Component
function AdminProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <PageSpinner text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [showLogoAnimation, setShowLogoAnimation] = useState(() => {
    // Check if user has seen the logo animation in the last 4 hours
    const lastSeen = localStorage.getItem("logoAnimationLastSeen");
    if (!lastSeen) return true;

    const lastSeenTime = parseInt(lastSeen);
    const now = Date.now();
    const hoursSinceLastSeen = (now - lastSeenTime) / (1000 * 60 * 60);

    return hoursSinceLastSeen >= 1;
  });

  // Memoize the monetization status to prevent unnecessary re-renders
  const isMonetizationEnabled = useMemo(
    () => monetizationEnabled,
    [monetizationEnabled]
  );

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      const enabled = monetizationConfig.isEnabled();
      if (enabled !== monetizationEnabled) {
        setMonetizationEnabled(enabled);
      }
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, [monetizationEnabled]);

  return (
    <div className="w-full">
      {showLogoAnimation && (
        <LogoAnimation
          onComplete={() => {
            setShowLogoAnimation(false);
            localStorage.setItem(
              "logoAnimationLastSeen",
              Date.now().toString()
            );
          }}
        />
      )}
      <Router>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/google/callback"
              element={
                <PublicRoute>
                  <GoogleCallback />
                </PublicRoute>
              }
            />
            {/* Redirect old register route to login */}
            <Route
              path="/register"
              element={<Navigate to="/login" replace />}
            />

            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    {/* Credits route - shows 404 when monetization is disabled */}
                    <Route
                      path="/credits"
                      element={
                        <ProtectedRoute>
                          <CreditsWrapper />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/search" element={<SearchProfiles />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookmarks"
                      element={
                        <ProtectedRoute>
                          <Bookmarks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-unlocks"
                      element={
                        <ProtectedRoute>
                          <MyUnlocks />
                        </ProtectedRoute>
                      }
                    />
                    {/* Transactions route - shows 404 when monetization is disabled */}
                    <Route
                      path="/transactions"
                      element={
                        <ProtectedRoute>
                          <TransactionsWrapper />
                        </ProtectedRoute>
                      }
                    />
                    {/* Orders route - shows 404 when monetization is disabled */}
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute>
                          <AllOrdersWrapper />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/create"
                      element={
                        <ProtectedRoute>
                          <CreateProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/edit/:profileId?"
                      element={
                        <ProtectedRoute>
                          <BiodataEdit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/view"
                      element={
                        <ProtectedRoute>
                          <BiodataView />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/view/:profileId"
                      element={
                        <ProtectedRoute>
                          <BiodataView />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminProtectedRoute>
                          <AdminDashboard />
                        </AdminProtectedRoute>
                      }
                    />
                    {/* Add more routes as needed */}
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Suspense>
      </Router>
      <SpeedInsights />
      <Analytics />
    </div>
  );
}

export default App;
