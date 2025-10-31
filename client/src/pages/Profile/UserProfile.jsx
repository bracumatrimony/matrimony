import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Edit,
  Eye,
  CreditCard,
  Trash2,
  BarChart3,
  Shield,
  Star,
  Calendar,
  MapPin,
  FileText,
  Bookmark,
  Facebook,
} from "lucide-react";
import authService from "../../services/authService";
import profileService from "../../services/profileService";
import userService from "../../services/userService";
import draftService from "../../services/draftService";
import bookmarkService from "../../services/bookmarkService";
import { useAuth } from "../../contexts/AuthContext";
import { SectionSpinner, ButtonSpinner } from "../../components/LoadingSpinner";
import monetizationConfig from "../../config/monetization";

export default function UserProfile() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [stats, setStats] = useState({
    bookmarks: 0,
    profileViews: 0,
    bookmarkedBy: 0,
    unlockedContacts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [isValidUniversityEmail, setIsValidUniversityEmail] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const navigate = useNavigate();

  // Initialize verification requested state based on user data
  useEffect(() => {
    if (user) {
      setVerificationRequested(user.verificationRequest || false);
    }
  }, [user]);

  // Check if user email is from a valid university
  useEffect(() => {
    const checkUniversityEmail = async () => {
      if (user && user.email) {
        try {
          const isValid = await authService.isValidUniversityEmail(user.email);
          setIsValidUniversityEmail(isValid);
        } catch (error) {
          console.error("Error checking university email:", error);
          setIsValidUniversityEmail(false);
        }
      } else {
        setIsValidUniversityEmail(false);
      }
    };

    checkUniversityEmail();
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [user, navigate]);

  // Listen for monetization config changes
  useEffect(() => {
    const handleConfigChange = () => {
      setMonetizationEnabled(monetizationConfig.isEnabled());
    };

    window.addEventListener("monetizationConfigChanged", handleConfigChange);

    // Initial check in case config loaded before component mounted
    setMonetizationEnabled(monetizationConfig.isEnabled());

    return () => {
      window.removeEventListener(
        "monetizationConfigChanged",
        handleConfigChange
      );
    };
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);

      // Check if user is logged in
      if (!user) {
        navigate("/login");
        return;
      }

      // Load profile/draft and stats concurrently
      const [profileResult, statsResult] = await Promise.allSettled([
        user.hasProfile
          ? profileService.getCurrentUserProfile()
          : draftService.getDraft(),
        loadStatsData(),
      ]);

      // Handle profile/draft result
      if (profileResult.status === "fulfilled" && profileResult.value.success) {
        if (user.hasProfile) {
          setProfile(profileResult.value.profile);
        } else if (profileResult.value.draft) {
          setDraft(profileResult.value.draft);
        }
      }

      // Handle stats result
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const loadStatsData = async () => {
    try {
      // Load both stats concurrently
      const [bookmarkStatsResponse, userStatsResponse] =
        await Promise.allSettled([
          bookmarkService.getStats(),
          userService.getUserStats(),
        ]);

      const bookmarkStats =
        bookmarkStatsResponse.status === "fulfilled" &&
        bookmarkStatsResponse.value.success
          ? bookmarkStatsResponse.value.stats
          : { myBookmarks: 0, bookmarkedBy: 0 };

      const userStats =
        userStatsResponse.status === "fulfilled" &&
        userStatsResponse.value.success
          ? userStatsResponse.value.stats
          : { profileViews: 0, unlockedContacts: 0 };

      return {
        bookmarks: bookmarkStats.myBookmarks,
        profileViews: userStats.profileViews,
        bookmarkedBy: bookmarkStats.bookmarkedBy,
        unlockedContacts: userStats.unlockedContacts,
      };
    } catch (error) {
      console.error("Error loading stats:", error);
      return {
        bookmarks: 0,
        profileViews: 0,
        bookmarkedBy: 0,
        unlockedContacts: 0,
      };
    }
  };

  const handleRequestVerification = async () => {
    try {
      setRequestingVerification(true);
      const response = await profileService.requestVerification();
      if (response.success) {
        setVerificationRequested(true);
        await refreshUser(); // Refresh user data after successful request
      } else {
        // If already verified, refresh user data to update UI
        if (response.message && response.message.includes("already verified")) {
          await refreshUser();
          alert("You are already verified as an alumni!");
        } else {
          alert(response.message || "Failed to submit verification request");
        }
      }
    } catch (error) {
      console.error("Error requesting verification:", error);
      alert("Failed to submit verification request. Please try again.");
    } finally {
      setRequestingVerification(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your biodata? This action cannot be undone."
      )
    ) {
      try {
        setLoading(true);
        await profileService.deleteProfile();

        // Update user context to reflect profile deletion
        const updatedUser = { ...user, hasProfile: false };
        updateUser(updatedUser);

        // Clear local storage as backup
        localStorage.removeItem("userProfile");
        setProfile(null);

        alert("Profile deleted successfully.");
      } catch (error) {
        console.error("Error deleting profile:", error);
        alert("Failed to delete profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Method to refresh stats - can be called from child components or after actions
  const refreshStats = async () => {
    const newStats = await loadStatsData();
    setStats(newStats);
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your entire account? This action cannot be undone and you will lose all data."
      )
    ) {
      try {
        setLoading(true);
        await userService.deleteAccount();

        // Use auth context logout which will clear all auth state
        logout();

        alert("Account deleted successfully.");
        navigate("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again.");
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SectionSpinner text="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUserData}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          {/* Top Section */}
          <div className="px-4 sm:px-8 py-6 bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 sm:space-x-6 w-full sm:w-auto">
                {/* Profile Picture */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0">
                  {user?.avatar || user?.picture ? (
                    <img
                      src={user.avatar || user.picture}
                      alt={user?.name || "User"}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-left pt-2 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 leading-tight text-left">
                    {user.name}
                  </h1>
                  <p className="text-sm text-gray-500 mb-2 leading-tight text-left pl-0 ml-0 break-words">
                    {user.email}
                  </p>
                  <div className="flex items-center space-x-4 text-gray-600">
                    {user.profileId && (
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        <span className="text-sm">ID: {user.profileId}</span>
                      </div>
                    )}
                    {profile && (
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          Profile: {profile.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Credits Badge - Show only when monetization is enabled and user is verified */}
              {monetizationEnabled &&
                (isValidUniversityEmail || user.alumniVerified) && (
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md w-full sm:w-auto">
                      <div className="flex items-center justify-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium text-sm sm:text-base">
                          {user.credits || 0} Credits
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/credits")}
                      className="mt-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer font-medium text-sm sm:text-base w-full sm:w-auto"
                    >
                      Buy more credits
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Status Card */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Profile Status
                </h2>
              </div>

              <div className="p-6">
                {/* Ban Message - Show regardless of profile status */}
                {user.isBanned && (
                  <div className="bg-red-50 border-4 border-black rounded-lg p-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Account Banned
                      </h3>
                      <p className="text-red-700 text-sm">
                        Your account has been banned by the administrators. You
                        no longer have access to the platform. If you believe
                        this is an error, please contact support.
                      </p>
                    </div>
                  </div>
                )}

                {/* Only show profile-related content if user is not banned */}
                {!user.isBanned && (
                  <>
                    {profile ? (
                      <div className="space-y-4">
                        {/* Status Indicator */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                profile.status === "approved"
                                  ? "bg-green-500"
                                  : profile.status === "pending_approval"
                                  ? "bg-yellow-500"
                                  : profile.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {profile.status === "approved"
                                  ? "Biodata Approved"
                                  : profile.status === "pending_approval"
                                  ? "Pending Approval"
                                  : profile.status === "rejected"
                                  ? "Biodata Rejected"
                                  : "Under Review"}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate("/profile/view")}
                              className="flex items-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => navigate("/profile/edit")}
                              className="flex items-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Messages */}
                        {profile.status === "pending_approval" && (
                          <div className="bg-yellow-50 border-4 border-black rounded-lg p-4">
                            <div className="flex items-center">
                              <p className="text-yellow-800 text-sm">
                                {profile.editCount > 0
                                  ? "Your biodata changes are being reviewed by our admin team. We'll notify you via email once it's approved and live on the platform."
                                  : "Your biodata is currently under review by our admin team. We'll notify you via email once it's approved and live on the platform."}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Restriction Message - Show below under review */}
                        {user.isRestricted && (
                          <div className="bg-yellow-50 border-4 border-black rounded-lg p-4">
                            <div>
                              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                Profile Under Investigation
                              </h3>
                              <p className="text-yellow-700 text-sm">
                                Your profile is currently under investigation by
                                our administrators. During this period, your
                                biodata is hidden from public view and you
                                cannot view other profiles. This is a temporary
                                measure to ensure compliance with our community
                                guidelines.
                              </p>
                            </div>
                          </div>
                        )}

                        {profile.status === "approved" && (
                          <div className="bg-green-50 border-4 border-black rounded-lg p-4">
                            <div className="flex items-center">
                              <p className="text-green-800 text-sm center mx-auto">
                                Congratulations! Your biodata is approved and
                                visible to other users.
                              </p>
                            </div>
                          </div>
                        )}

                        {profile.status === "rejected" && (
                          <div className="bg-red-50 border-4 border-black rounded-lg p-4">
                            <div className="space-y-2">
                              <p className="text-red-800 text-sm font-medium">
                                Your biodata has been rejected by the admin
                                team.
                              </p>
                              {profile.rejectionReason && (
                                <div className="mt-2 pt-2 border-t border-red-200">
                                  <p className="text-red-700 text-sm">
                                    <strong>Reason:</strong>{" "}
                                    {profile.rejectionReason}
                                  </p>
                                </div>
                              )}
                              <p className="text-red-600 text-xs mt-2">
                                Please review the reason and edit your biodata
                                to address the issues.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* No Profile State */
                      <div className="text-center py-12">
                        {/* Check if user has university email or is verified alumni */}
                        {user &&
                        user.email &&
                        !isValidUniversityEmail &&
                        !user.alumniVerified ? (
                          /* Non-university user message */
                          <div className="max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Shield className="h-8 w-8 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-3">
                              Biodata Creation Policy
                            </h3>
                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 mb-6">
                              <p className="text-rose-800 text-sm leading-relaxed">
                                To maintain the authenticity and integrity of
                                our platform, only verified students with
                                institutional email addresses are permitted to
                                create biodata.
                              </p>
                              <p className="text-rose-700 text-sm mt-3">
                                This policy ensures that our matrimony platform
                                serves verified students, alumni, and faculty
                                members while maintaining high standards of
                                verification.
                              </p>
                            </div>
                            {verificationRequested ? (
                              /* Verification requested */
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center justify-center mb-3">
                                  <h4 className="text-lg font-medium text-yellow-900">
                                    Verification Request Submitted
                                  </h4>
                                </div>
                                <p className="text-yellow-800 text-sm leading-relaxed text-center">
                                  Your verification request has been submitted.
                                  Please send a photo of your past ID card or
                                  proof of your institutional affiliation or
                                  student status to our Facebook page for
                                  review.
                                </p>
                              </div>
                            ) : (
                              /* Request verification button */
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                  onClick={handleRequestVerification}
                                  disabled={requestingVerification}
                                  className="bg-white text-black border border-black px-6 py-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                  {requestingVerification ? (
                                    <ButtonSpinner />
                                  ) : (
                                    "Request Alumni Verification"
                                  )}
                                </button>
                                <button
                                  onClick={() => navigate("/search")}
                                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                                >
                                  Browse Biodata's
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* University user - normal biodata creation flow */
                          <>
                            {draft ? (
                              /* Draft exists - show "View Draft" */
                              <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <FileText className="h-8 w-8 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  Continue Your Biodata
                                </h3>
                                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                                  You have a saved draft of your biodata.
                                  Continue where you left off to complete your
                                  profile.
                                </p>
                                <div className="bg-gray-50 border-4 border-black rounded-lg p-4 mb-6 max-w-sm mx-auto">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-800 font-medium">
                                      Progress:
                                    </span>
                                    <span className="text-gray-600">
                                      Step {draft.currentStep} of 4
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                      className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${
                                          (draft.currentStep / 4) * 100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                  <button
                                    onClick={() => navigate("/profile/create")}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                                  >
                                    View Draft & Continue
                                  </button>
                                  <button
                                    onClick={() =>
                                      navigate("/profile/create?new=true")
                                    }
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                                  >
                                    Start Fresh
                                  </button>
                                </div>
                              </>
                            ) : (
                              /* No draft - show "Create Your Biodata" */
                              <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  Create Your Biodata
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                  Start your matrimonial journey by creating a
                                  detailed biodata to find your perfect match.
                                </p>
                                <button
                                  onClick={() => navigate("/profile/create")}
                                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                                >
                                  Create Biodata
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Complete Biodata Information */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Account Management
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {profile && (
                    <div className="border border-red-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Delete Biodata
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Remove your biodata from the platform. This action
                        cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteProfile}
                        disabled={loading}
                        className={`flex items-center px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors ${
                          loading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {loading ? (
                          <ButtonSpinner color="rose" className="mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {loading ? "Deleting..." : "Delete Biodata"}
                      </button>
                    </div>
                  )}

                  {/* Delete Account - Only show for non-banned users */}
                  {!user.isBanned && (
                    <div className="border border-red-300 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Delete Account
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className={`flex items-center px-4 py-2 text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors ${
                          loading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {loading ? (
                          <ButtonSpinner color="rose" className="mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {loading ? "Deleting..." : "Delete Account"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Analytics */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Analytics
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="text-2xl font-semibold text-gray-900">
                      {stats.profileViews}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">My Bookmarks</span>
                    <span className="text-2xl font-semibold text-gray-900">
                      {stats.bookmarks}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bookmarked By</span>
                    <span className="text-2xl font-semibold text-gray-900">
                      {stats.bookmarkedBy}
                    </span>
                  </div>
                  {monetizationEnabled &&
                    (!user.email.endsWith("@gmail.com") ||
                      user.alumniVerified) && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Contact Unlocks</span>
                        <span className="text-2xl font-semibold text-gray-900">
                          {stats.unlockedContacts}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/search")}
                    className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">
                      Search Profiles
                    </div>
                    <div className="text-sm text-gray-600">
                      Find your perfect match
                    </div>
                  </button>

                  <button
                    onClick={() => navigate("/bookmarks")}
                    className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">
                      My Bookmarks
                    </div>
                    <div className="text-sm text-gray-600">
                      View saved bookmarks
                    </div>
                  </button>

                  {/* Buy Credits button - Show only when monetization is enabled and user is verified */}
                  {monetizationEnabled &&
                    (!user.email.endsWith("@gmail.com") ||
                      user.alumniVerified) && (
                      <button
                        onClick={() => navigate("/credits")}
                        className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">
                          Buy Credits
                        </div>
                        <div className="text-sm text-gray-600">
                          Unlock more features
                        </div>
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Follow Facebook Page */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center">
                  <Facebook className="h-5 w-5 text-gray-900 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Follow Us
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-4">
                    Stay connected with Campus Matrimony updates and community
                    news
                  </p>
                  <button
                    onClick={() =>
                      window.open(
                        "https://www.facebook.com/profile.php?id=61582222400578",
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-md transition-colors cursor-pointer"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    <span>Follow on Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
