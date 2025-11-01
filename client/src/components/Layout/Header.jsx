import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { monetizationConfig } from "../../config/monetization";
import {
  User,
  Search,
  CreditCard,
  Menu,
  X,
  Bookmark,
  Shield,
  LogOut,
  Package,
  Eye,
} from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Memoize monetization status
  const isMonetizationEnabled = useMemo(
    () => monetizationEnabled,
    [monetizationEnabled]
  );

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      const enabled = monetizationConfig.isEnabled();
      if (enabled !== monetizationEnabled) {
        setMonetizationEnabled(enabled);
      }
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, [monetizationEnabled]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  return (
    <header className="bg-white sticky top-0 z-50 border-b-2 border-black shadow-sm w-full">
      <div className="w-full px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Large Brand Text with Icon */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="https://res.cloudinary.com/dkir6pztp/image/upload/v1761749569/logo_xwcdnr.jpg"
              alt="Campus Matrimony"
              className="h-14 w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 object-contain"
            />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 tracking-tight leading-tight">
              Campus{" "}
              <span className="font-medium bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Matrimony
              </span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/search"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-medium no-underline"
            >
              <Search className="h-4 w-4" />
              <span>Search Biodata's</span>
            </Link>

            {user ? (
              <>
                {/* Conditionally show credits display based on monetization config and user verification */}
                {isMonetizationEnabled &&
                  (!user.email.endsWith("@gmail.com") ||
                    user.alumniVerified) && (
                    <Link
                      to="/credits"
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium no-underline"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Credits: {user?.credits || 0}</span>
                    </Link>
                  )}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors font-medium bg-white hover:bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                    {user?.avatar || user?.picture ? (
                      <img
                        src={user.avatar || user.picture}
                        alt={user?.name || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <span>{user?.name?.split(" ")[0] || "User"}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-sm border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <Link
                      to="/profile"
                      className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                    >
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </div>
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                    >
                      <div className="flex items-center space-x-3">
                        <Bookmark className="h-4 w-4" />
                        <span>Bookmarks</span>
                      </div>
                    </Link>
                    {/* Conditionally show credit-related links based on monetization config and user verification */}
                    {isMonetizationEnabled &&
                      (!user.email.endsWith("@gmail.com") ||
                        user.alumniVerified) && (
                        <>
                          <Link
                            to="/my-unlocks"
                            className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                          >
                            <div className="flex items-center space-x-3">
                              <Eye className="h-4 w-4" />
                              <span>My Unlocks</span>
                            </div>
                          </Link>
                          <Link
                            to="/transactions"
                            className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                          >
                            <div className="flex items-center space-x-3">
                              <CreditCard className="h-4 w-4" />
                              <span>Transactions</span>
                            </div>
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                          >
                            <div className="flex items-center space-x-3">
                              <Package className="h-4 w-4" />
                              <span>All Orders</span>
                            </div>
                          </Link>
                        </>
                      )}
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline"
                      >
                        <div className="flex items-center space-x-3">
                          <Shield className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </div>
                      </Link>
                    )}
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors font-medium no-underline"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-3">
              <Link
                to="/search"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                <span>Search Biodata's</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  {/* Conditionally show credits in mobile menu based on monetization config and user verification */}
                  {isMonetizationEnabled &&
                    (!user.email.endsWith("@gmail.com") ||
                      user.alumniVerified) && (
                      <Link
                        to="/credits"
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Credits: {user?.credits || 0}</span>
                      </Link>
                    )}
                  <Link
                    to="/bookmarks"
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Bookmarks</span>
                  </Link>
                  {/* Conditionally show transactions and orders links based on monetization config and user verification */}
                  {isMonetizationEnabled &&
                    (!user.email.endsWith("@gmail.com") ||
                      user.alumniVerified) && (
                      <>
                        <Link
                          to="/transactions"
                          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Transactions</span>
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          <span>All Orders</span>
                        </Link>
                      </>
                    )}
                  {user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-white transition-colors w-full cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors block text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login / Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
