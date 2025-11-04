import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("Google OAuth error:", error);
        navigate("/login?error=oauth_error");
        return;
      }

      if (code) {
        try {
          
          const response = await authService.makeRequest(
            "/auth/google/callback",
            {
              method: "POST",
              body: JSON.stringify({ code }),
            }
          );

          if (response.success) {
            login(response.user);
            navigate("/profile");
          } else {
            navigate("/login?error=authentication_failed");
          }
        } catch (error) {
          console.error("Google callback error:", error);
          navigate("/login?error=authentication_failed");
        }
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center"></div>
  );
}
