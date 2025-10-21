import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SearchProfiles from "../../pages/SearchProfiles";
import { PageSpinner } from "../LoadingSpinner";

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageSpinner text="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    // Always redirect authenticated users to their profile page
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicRoute;
