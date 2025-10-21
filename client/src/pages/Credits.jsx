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
import { ButtonSpinner } from "../components/LoadingSpinner";
import profileService from "../services/profileService";

export default function Credits() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openFAQ, setOpenFAQ] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      // Load user profile to check approval status only if user has a profile
      const parsedUser = JSON.parse(userData);
      if (parsedUser?.hasProfile) {
        loadUserProfile();
      }
    }
  }, []);

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
      price: 200,
      discount: 0,
      popular: false,
    },
    {
      id: 2,
      credits: 5,
      price: 800,
      originalPrice: 1000,
      discount: 20,
      popular: true,
    },
    {
      id: 3,
      credits: 10,
      price: 1400,
      originalPrice: 2000,
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
    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call backend to add credits and record transaction
      const res = await profileService.makeRequest("/users/credits", {
        method: "PUT",
        body: JSON.stringify({
          credits: packageData.credits,
          operation: "add",
        }),
      });

      if (res.success) {
        // Update user credits in state
        setUser((prev) => ({ ...prev, credits: res.credits }));
        alert(`Successfully purchased ${packageData.credits} credits!`);
        setSelectedPackage(null);
      } else {
        alert(res.message || "Payment failed. Please try again.");
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Create Biodata for Discount Message - Show only if user doesn't have approved profile */}
        {!hasProfileDiscount && user && (!user.hasProfile || !userProfile) && (
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="relative">
                <CreditCard className="h-8 w-8 flex-shrink-0 absolute left-0 top-1/2 -translate-y-1/2" />
                <div className="pl-10 text-left">
                  <h3 className="font-semibold text-lg text-left">
                    Create Biodata & Save 50%!
                  </h3>
                  <p className="text-rose-100 text-sm text-left">
                    Complete your profile to unlock exclusive discounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/profile/create")}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <span>Create Now</span>
                <span className="bg-white text-rose-600 text-xs px-2 py-1 rounded-full font-medium">
                  50% OFF
                </span>
              </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Confirm Purchase
              </h3>
              <p className="text-gray-600">
                Review your order details before proceeding
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Package:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPackage.credits} Credits
                  </span>
                </div>
                {hasProfileDiscount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Original Price:
                    </span>
                    <span className="line-through text-gray-500">
                      ৳{selectedPackage.price}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">
                    {hasProfileDiscount ? "Discounted Price:" : "Total Price:"}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    ৳{calculateDiscountedPrice(selectedPackage.price)}
                  </span>
                </div>
                {hasProfileDiscount && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">
                      Profile Holder Discount:
                    </span>
                    <span className="text-green-600 font-semibold">
                      50% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedPackage(null)}
                disabled={isLoading}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedPackage)}
                disabled={isLoading}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <ButtonSpinner />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
