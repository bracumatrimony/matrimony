import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { user, loading, isAuthenticated, hasCompletedProfile } = useAuth();
  const location = useLocation();

  
  if (loading) {
    return null; 
  }

  if (!isAuthenticated) {
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && !hasCompletedProfile) {
    
    
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
