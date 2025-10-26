import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  ShoppingCart,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { ButtonSpinner, SectionSpinner } from "../components/LoadingSpinner";
import profileService from "../services/profileService";

export default function Credits() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState({});
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const navigate = useNavigate();

  // Handle success animation navigation
  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        navigate("/orders");
      }, 3000); // Navigate after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessAnimation, navigate]);

  useEffect(() => {
    const initializeComponent = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Check if user should have access to credits
        if (
          parsedUser.email.endsWith("@gmail.com") &&
          !parsedUser.alumniVerified
        ) {
          navigate("/");
          setLoading(false);
          return;
        }

        // Load user profile to check approval status only if user has a profile
        if (parsedUser?.hasProfile) {
          await loadUserProfile();
        }
      }
      setLoading(false);
    };

    initializeComponent();
  }, [navigate]);

  const loadUserProfile = async () => {
    try {
      const response = await profileService.getCurrentUserProfile();
      if (response.success) {
        setUserProfile(response.profile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Profile doesn't exist or error occurred, set to null
      setUserProfile(null);
    }
  };

  const creditPackages = [
    {
      id: 1,
      credits: 1,
      price: 70,
      originalPrice: 70,
      discount: 0,
      popular: false,
    },
    {
      id: 2,
      credits: 5,
      price: 299,
      originalPrice: 350,
      discount: 15,
      popular: true,
    },
    {
      id: 3,
      credits: 10,
      price: 499,
      originalPrice: 700,
      discount: 30,
      popular: false,
    },
  ];

  // Only give discount if user has an approved profile
  const hasProfileDiscount = userProfile?.status === "approved";

  const calculateDiscountedPrice = (price) => {
    return hasProfileDiscount ? Math.round(price * 0.5) : price;
  };

  const toggleFAQ = (index) => {
    setOpenFAQ((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePurchase = async (packageData) => {
    if (!transactionId.trim() || !phoneNumber.trim()) {
      alert("Please enter both transaction ID and phone number");
      return;
    }

    setIsLoading(true);
    try {
      // Submit purchase order for manual verification
      const res = await profileService.makeRequest("/transactions/purchase", {
        method: "POST",
        body: JSON.stringify({
          credits: packageData.credits,
          price: calculateDiscountedPrice(packageData.price),
          transactionId: transactionId.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });

      if (res.success) {
        // Show success animation before navigating
        setShowSuccessAnimation(true);
        setSelectedPackage(null);
        setTransactionId("");
        setPhoneNumber("");
      } else {
        alert(
          res.message || "Failed to submit purchase order. Please try again."
        );
      }
    } catch (error) {
      alert("Failed to submit purchase order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-64">
            <SectionSpinner text="Loading credits..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Create Biodata for Discount Message - Show only if user doesn't have approved profile */}
        {!hasProfileDiscount && user && (!user.hasProfile || !userProfile) && (
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 min-w-0">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 absolute left-0 top-1/2 -translate-y-1/2" />
                <div className="pl-8 sm:pl-10 text-left">
                  <h3 className="font-semibold text-base sm:text-lg text-left">
                    Create Biodata & Save 50%!
                  </h3>
                  <p className="text-rose-100 text-sm text-left">
                    Complete your profile to unlock exclusive discounts
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate("/profile/create")}
                  className="bg-white text-rose-600 hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap font-medium w-full sm:w-auto justify-center"
                >
                  <span>Create Now</span>
                  <span className="bg-rose-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    50% OFF
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval Message - Show if user has profile but not approved */}
        {!hasProfileDiscount &&
          userProfile &&
          userProfile.status === "pending_approval" && (
            <div className="bg-yellow-500 text-white border-4 border-black rounded-lg p-4 mb-6">
              <div className="relative">
                <Info className="h-8 w-8 flex-shrink-0 absolute left-0 top-1/2 -translate-y-1/2" />
                <div className="pl-10 text-left">
                  <p className="font-medium text-left">Biodata Under Review</p>
                  <p className="text-yellow-100 text-sm text-left">
                    You'll get 50% OFF once approved!
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Rejected/Other Status Message - Show if user has profile but it's rejected or other status */}
        {!hasProfileDiscount &&
          userProfile &&
          userProfile.status !== "pending_approval" &&
          userProfile.status !== "approved" && (
            <div className="bg-red-500 text-white border-4 border-black rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Biodata Needs Attention</p>
                  <p className="text-red-100 text-sm">
                    Complete updates to unlock 50% OFF
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Profile Discount Notice */}
        {hasProfileDiscount && (
          <div className="bg-green-500 text-white border-4 border-black rounded-lg p-4 mb-6">
            <div className="relative">
              <Check className="h-8 w-8 flex-shrink-0 absolute left-0 top-1/2 -translate-y-1/2" />
              <div className="pl-10 text-left">
                <p className="font-medium text-left">
                  Profile Holder Discount Active
                </p>
                <p className="text-green-100 text-sm text-left">
                  You get 50% OFF on all credit packages!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Credit Packages */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Available Credit Packages
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md flex flex-col h-full ${
                    pkg.popular
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {pkg.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6 flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {pkg.credits} Credit{pkg.credits > 1 ? "s" : ""}
                    </h3>

                    <div className="mb-4">
                      {hasProfileDiscount && (
                        <p className="text-sm text-gray-500 line-through mb-1">
                          ৳{pkg.price}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-gray-900">
                        ৳{calculateDiscountedPrice(pkg.price)}
                      </p>
                      {pkg.originalPrice && !hasProfileDiscount && (
                        <p className="text-sm text-gray-500 line-through mt-1">
                          ৳{pkg.originalPrice}
                        </p>
                      )}
                    </div>

                    {((pkg.discount > 0 && !hasProfileDiscount) ||
                      hasProfileDiscount) && (
                      <div className="mb-4">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          {hasProfileDiscount
                            ? "50% OFF"
                            : `${pkg.discount}% OFF`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                      <span>
                        Unlock {pkg.credits} biodata{pkg.credits > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                      <span>Access to contact information</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                      <span>Credits never expire</span>
                    </div>
                    {pkg.credits >= 5 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                        <span>Best value for money</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors cursor-pointer flex-shrink-0 ${
                      pkg.popular
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Purchase Now</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-600 flex-shrink-0" />
              <h3 className="text-lg font-medium text-gray-900">
                Frequently Asked Questions
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFAQ(0)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900">
                    Why do I need credits to view contact information?
                  </h4>
                  {openFAQ[0] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFAQ[0] && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      Our credit system ensures serious interactions between
                      users. Many visitors browse profiles and request contact
                      information without genuine matrimonial intentions. By
                      implementing a credit system, we maintain a community of
                      committed individuals who are genuinely interested in
                      finding their life partners.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFAQ(1)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900">
                    Why are credits necessary for the platform?
                  </h4>
                  {openFAQ[1] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFAQ[1] && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      Credits help us maintain and improve our platform by
                      covering essential operational costs including server
                      maintenance, security updates, customer support, and
                      continuous feature development. This ensures we can
                      provide you with a reliable, secure, and high-quality
                      matrimonial service.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFAQ(2)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900">
                    What is your refund policy?
                  </h4>
                  {openFAQ[2] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFAQ[2] && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      Please note that all credit purchases are final and
                      non-refundable. We encourage users to carefully consider
                      their needs before making a purchase.
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFAQ(3)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900">
                    How does the 50% discount work?
                  </h4>
                  {openFAQ[3] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFAQ[3] && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      We offer an exclusive 50% discount on all credit packages
                      to users who have successfully created and received
                      approval for their biodata profiles. This incentive
                      encourages complete profile creation and helps build a
                      more comprehensive community of verified members.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="text-center mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                Purchase Credits
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Complete your payment to get credits
              </p>
            </div>

            {/* Payment Instructions */}
            <div className="mb-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3">
                <h4 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">
                  Payment Instructions
                </h4>
                <div className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <p>
                    1. Send{" "}
                    <strong>
                      ৳{calculateDiscountedPrice(selectedPackage.price)}
                    </strong>{" "}
                    to:{" "}
                    <span className="font-mono font-bold text-blue-900">
                      01622044060
                    </span>
                  </p>
                  <p>2. Note the Transaction ID from bKash</p>
                  <p>3. Fill details below and submit</p>
                  <p>4. Admin verification within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="mb-3">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">
                    Package:
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {selectedPackage.credits} Credits
                  </span>
                </div>
                {hasProfileDiscount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium text-sm">
                      Original:
                    </span>
                    <span className="line-through text-gray-500 text-sm">
                      ৳{selectedPackage.price}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-200">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">
                    {hasProfileDiscount ? "Discounted Price:" : "Total:"}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    ৳{calculateDiscountedPrice(selectedPackage.price)}
                  </span>
                </div>
                {hasProfileDiscount && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium text-sm">
                      Discount:
                    </span>
                    <span className="text-green-600 font-semibold text-sm">
                      50% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details Form */}
            <div className="mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Phone Number (bKash)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    bKash Transaction ID
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g., BKH123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => {
                  setSelectedPackage(null);
                  setTransactionId("");
                  setPhoneNumber("");
                }}
                disabled={isLoading}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedPackage)}
                disabled={
                  isLoading || !transactionId.trim() || !phoneNumber.trim()
                }
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <ButtonSpinner />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              type: "spring",
              bounce: 0.4,
            }}
            className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-6 max-w-sm mx-4 text-center overflow-hidden"
          >
            {/* Success icon with pulse */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                bounce: 0.6,
              }}
              className="relative z-10 mb-6"
            >
              <motion.div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-10 h-10 text-green-600" />
              </motion.div>
            </motion.div>

            {/* Success message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10"
            >
              <motion.h2
                animate={{
                  color: ["#ffffff", "#f0f9ff", "#ffffff"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-2xl font-bold text-white mb-2"
              >
                Order Submitted Successfully!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-white/90 text-sm"
              >
                Your purchase order has been submitted for verification.
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
