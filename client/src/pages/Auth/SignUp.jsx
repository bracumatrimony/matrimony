import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GoogleSignIn from "../../components/Auth/GoogleSignIn";
import SEO from "../../components/SEO";
import authService from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

export default function SignUp() {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
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
    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleLocalSignUp = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.authenticateWithEmail(
        formData.email,
        formData.password,
        "register",
        formData.name
      );

      if (response.success) {
        login(response.user);
        // Redirect will be handled by the auth context or protected routes
      }
    } catch (error) {
      setErrors({
        general: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Sign Up - Campus Matrimony"
        description="Create your Campus Matrimony account to find your perfect match. Join our community of verified university students and alumni."
        keywords="sign up, register, create account, Campus matrimony account, matrimonial registration"
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

        {/* Sign Up Form - Overlay on mobile, side panel on desktop */}
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
                  Create your account
                </p>
              </div>

              <div className="h-px bg-white/20 md:bg-gray-100 my-4" />

              {/* Sign Up Content */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-md mb-6">
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

              {/* Local Sign Up Form */}
              <form onSubmit={handleLocalSignUp} className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-white md:text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 md:border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/10 md:bg-white text-white md:text-gray-900"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white md:text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 md:border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/10 md:bg-white text-white md:text-gray-900"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white md:text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 md:border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/10 md:bg-white text-white md:text-gray-900"
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-white md:text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 md:border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/10 md:bg-white text-white md:text-gray-900"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20 md:border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-white md:text-gray-500">
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* Google Sign-In */}
              <div className="space-y-4">
                <GoogleSignIn />
              </div>

              {/* Footer links */}
              <div className="text-center text-xs text-white md:text-gray-500 mt-6">
                Already have an account?
                <span className="mx-1">·</span>
                <Link
                  to="/login"
                  className="text-white md:text-rose-500 hover:underline"
                >
                  Sign in
                </Link>
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
