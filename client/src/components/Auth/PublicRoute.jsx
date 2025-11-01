import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SearchProfiles from "../../pages/SearchProfiles";

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return null; // Return null instead of spinner to avoid flash
  }

  if (isAuthenticated) {
    // Always redirect authenticated users to their profile page
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicRoute;
