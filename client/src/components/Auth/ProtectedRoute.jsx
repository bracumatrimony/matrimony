import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PageSpinner } from "../LoadingSpinner";

const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { user, loading, isAuthenticated, hasCompletedProfile } = useAuth();
  const location = useLocation();

  // Show a single unified loading state while auth is initializing
  if (loading) {
    return <PageSpinner text="Loading..." />;
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
