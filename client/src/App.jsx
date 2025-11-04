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
import LogoAnimation from "./components/LogoAnimation";
import { useAuth } from "./contexts/AuthContext";
import { monetizationConfig } from "./config/monetization";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";


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


function AdminProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return null; 
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
    
    const lastSeen = localStorage.getItem("logoAnimationLastSeen");
    if (!lastSeen) return true;

    const lastSeenTime = parseInt(lastSeen);
    const now = Date.now();
    const hoursSinceLastSeen = (now - lastSeenTime) / (1000 * 60 * 60);

    return hoursSinceLastSeen >= 1;
  });

  
  const isMonetizationEnabled = useMemo(
    () => monetizationEnabled,
    [monetizationEnabled]
  );

  
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
        <Suspense>
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

            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    {}
                    <Route
                      path="/credits"
                      element={
                        <ProtectedRoute>
                          <CreditsWrapper />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/search" element={<SearchProfiles />} />
                    <Route
                      path="/search/:university"
                      element={<SearchProfiles />}
                    />
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
                    {}
                    <Route
                      path="/transactions"
                      element={
                        <ProtectedRoute>
                          <TransactionsWrapper />
                        </ProtectedRoute>
                      }
                    />
                    {}
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
                    {}
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
