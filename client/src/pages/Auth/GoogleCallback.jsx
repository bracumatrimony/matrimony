import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const hasProcessedRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessedRef.current) {
      addDebugInfo("Already processed, skipping");
      return;
    }

    const handleCallback = async () => {
      hasProcessedRef.current = true;
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      addDebugInfo("Starting authentication flow");
      addDebugInfo(`Code: ${code ? "Present" : "Missing"}`);
      addDebugInfo(`Error: ${error || "None"}`);

      if (error) {
        addDebugInfo(`OAuth error detected: ${error}`);
        setTimeout(() => {
          navigate("/login?error=oauth_error", { replace: true });
        }, 1000);
        return;
      }

      if (code) {
        // Set a timeout to prevent infinite hanging
        const timeoutId = setTimeout(() => {
          addDebugInfo(
            "⚠️ Authentication timeout (15s) - redirecting to login"
          );
          navigate("/login?error=timeout", { replace: true });
        }, 15000);

        try {
          addDebugInfo("Making POST request to /auth/google/callback");
          const requestBody = {
            code,
            redirectUri: window.location.origin + "/auth/google/callback",
          };
          addDebugInfo(`Request URI: ${requestBody.redirectUri}`);

          const response = await authService.makeRequest(
            "/auth/google/callback",
            {
              method: "POST",
              body: JSON.stringify(requestBody),
            }
          );

          clearTimeout(timeoutId);
          addDebugInfo(
            `✓ Server responded: ${JSON.stringify(response).substring(
              0,
              100
            )}...`
          );

          if (response.success) {
            addDebugInfo("✓ Authentication successful");
            addDebugInfo(`User: ${response.user?.email}`);
            login(response.user);
            addDebugInfo("Redirecting to /profile");
            setTimeout(() => {
              navigate("/profile", { replace: true });
            }, 500);
          } else {
            addDebugInfo(`✗ Authentication failed: ${response.message}`);
            setTimeout(() => {
              navigate("/login?error=authentication_failed", { replace: true });
            }, 2000);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          addDebugInfo(`✗ Exception caught: ${error.message}`);
          addDebugInfo(`Error status: ${error.status || "N/A"}`);
          setTimeout(() => {
            navigate("/login?error=authentication_failed", { replace: true });
          }, 2000);
        }
      } else {
        addDebugInfo("No code provided, redirecting to login");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1000);
      }
    };

    handleCallback();
  }, []); // Empty dependency array to run only once

  // Show debug info during development
  if (import.meta.env.DEV || debugInfo.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
          <h2 className="text-lg font-semibold mb-4">Authenticating...</h2>
          <div className="bg-gray-100 rounded p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-gray-700">
                {info}
              </div>
            ))}
            {debugInfo.length === 0 && (
              <div className="text-gray-500">Initializing...</div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            If this takes more than 15 seconds, you'll be redirected
            automatically.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
