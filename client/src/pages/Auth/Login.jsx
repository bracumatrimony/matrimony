import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import authService from "../../services/authService";
import GoogleSignIn from "../../components/Auth/GoogleSignIn";
import SEO from "../../components/SEO";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check for OAuth errors in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      let errorMessage = "Authentication failed";
      if (error === "oauth_error") {
        errorMessage = "Google authentication was cancelled or failed";
      } else if (error === "authentication_failed") {
        errorMessage = "Authentication failed. Please try again.";
      }

      setErrors({ general: errorMessage });

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const result = await authService.authenticateWithEmail(
        formData.email,
        formData.password,
        "login"
      );

      if (result.success) {
        login(result.user);
        navigate("/profile");
      }
    } catch (error) {
      setErrors({
        general: error.message || "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login - Campus Matrimony"
        description="Login to your Campus Matrimony account to find your perfect match. Access verified profiles and connect with potential partners."
        keywords="login, sign in, Campus matrimony account, matrimonial login"
      />
      <div className="min-h-screen bg-black flex overflow-hidden auth-page relative">
        {/* Background Video - Full screen for mobile, left side for desktop */}
        <div className="absolute md:relative inset-0 md:flex-1 bg-black flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {/* Background Image */}
          <img
            src="https://res.cloudinary.com/dkir6pztp/image/upload/v1761750392/login_banner_tfrdbr.png"
            alt="wedding background"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            style={{ backgroundColor: "black" }}
          />

          {/* Overlay for text readability (tuned for clarity on mobile) */}
          <div className="absolute inset-0 bg-black/20 md:bg-black/30"></div>

          {/* Desktop Quote - Hidden on mobile */}
          <div className="hidden md:block text-center relative z-10 auth-brand">
            <div className="mb-8">
              <blockquote className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-white leading-relaxed mb-4 tracking-wide drop-shadow-md px-2">
                When a man marries he has fulfilled half of the religion, so let
                him fear God regarding the remaining half.
              </blockquote>
            </div>
            <div className="text-center">
              <div className="bg-white/20 px-6 py-3 rounded-full inline-block ring-1 ring-white/20 shadow-sm">
                <cite className="text-lg text-white font-semibold not-italic tracking-wide drop-shadow-sm">
                  Mishkat al-Masabih 3096
                </cite>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form - Overlay on mobile, side panel on desktop */}
        <div className="absolute md:relative inset-0 md:inset-auto w-full md:max-w-md lg:max-w-lg flex flex-col items-stretch md:bg-white md:h-screen">
          <div className="w-full flex flex-col h-full justify-center items-center px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 auth-form relative z-10">
            {/* Professional Card with Mobile Blur Box */}
            <div className="w-full max-w-md bg-white/[0.08] md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border border-white/[0.15] md:border-none rounded-2xl p-6 md:p-8 shadow-lg md:shadow-none text-white md:text-slate-900">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-semibold text-white md:text-slate-900 mb-2 sm:mb-3">
                  Campus
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                    {" "}
                    Matrimony
                  </span>
                </h2>
                <p className="text-white md:text-slate-700 text-sm sm:text-base leading-relaxed px-2 font-medium">
                  Sign in to your account or create a new one
                </p>
              </div>

              <div className="h-px bg-white/20 md:bg-gray-100 my-4" />

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">
                          {errors.general}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Google Sign-In */}
              <div className="mt-6">
                <GoogleSignIn />
              </div>

              {/* Footer links */}
              <div className="text-center text-xs text-white md:text-gray-500 mt-6">
                By continuing you agree to our
                <span className="mx-1">·</span>
                <Link
                  to="/terms"
                  className="text-white md:text-rose-500 hover:underline"
                >
                  Terms
                </Link>
                <span className="mx-1">·</span>
                <Link
                  to="/privacy"
                  className="text-white md:text-rose-500 hover:underline"
                >
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
