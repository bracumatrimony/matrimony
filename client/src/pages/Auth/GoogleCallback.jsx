import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const hasProcessedRef = useRef(false);
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Establishing secure connection...");

  useEffect(() => {
    if (hasProcessedRef.current) return;

    const handleCallback = async () => {
      hasProcessedRef.current = true;
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        setStatus("error");
        setMessage("Authentication process was cancelled");
        setTimeout(
          () => navigate("/login?error=oauth_error", { replace: true }),
          2000
        );
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Authorization code is missing");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      // Timeout protection
      const timeoutId = setTimeout(() => {
        setStatus("error");
        setMessage("Connection timeout. Please try signing in again.");
        setTimeout(
          () => navigate("/login?error=timeout", { replace: true }),
          2000
        );
      }, 20000);

      try {
        setMessage("Establishing secure connection...");

        const response = await authService.makeRequest(
          "/auth/google/callback",
          {
            method: "POST",
            body: JSON.stringify({
              code,
              redirectUri: window.location.origin + "/auth/google/callback",
            }),
          }
        );

        clearTimeout(timeoutId);

        if (response.success) {
          setStatus("success");
          setMessage(
            "Authentication successful. Redirecting to your dashboard..."
          );
          login(response.user);

          setTimeout(() => {
            navigate("/profile", { replace: true });
          }, 1500);
        } else {
          setStatus("error");
          setMessage(response.message || "Authentication verification failed");
          setTimeout(() => {
            navigate("/login?error=authentication_failed", { replace: true });
          }, 3000);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Authentication error:", error);
        setStatus("error");
        setMessage("Unable to verify authentication credentials");
        setTimeout(() => {
          navigate("/login?error=authentication_failed", { replace: true });
        }, 2500);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Status Icon */}
        {status === "verifying" && (
          <div className="mb-6">{/* No icon for verifying state */}</div>
        )}

        {status === "success" && (
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {status === "verifying" && "Authenticating Your Account"}
          {status === "success" && "Authentication Successful"}
          {status === "error" && "Authentication Unsuccessful"}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
          <svg
            className="w-5 h-5 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Secure Authentication
          </span>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-8">
          Your connection is protected by advanced security protocols
        </p>
      </div>
    </div>
  );
}
