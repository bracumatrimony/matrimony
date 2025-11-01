import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { user, loading, isAuthenticated, hasCompletedProfile } = useAuth();
  const location = useLocation();

  // Don't show loading spinner - let the page render immediately
  if (loading) {
    return null; // Return null instead of spinner to avoid flash
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && !hasCompletedProfile) {
    // Redirect to profile page if profile is required but not completed
    // Users can choose to create a biodata from their profile page
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
