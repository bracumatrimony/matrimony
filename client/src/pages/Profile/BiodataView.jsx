import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Edit,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Home,
  Heart,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
  Contact,
  Lock,
  Unlock,
  CreditCard,
  Gift,
  X,
} from "lucide-react";
import profileService from "../../services/profileService";
import adminService from "../../services/adminService";
import authService from "../../services/authService";
import userService from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";
import { monetizationConfig } from "../../config/monetization";
import SEO from "../../components/SEO";
import BookmarkButton from "../../components/BookmarkButton";
import { SectionSpinner, ButtonSpinner } from "../../components/LoadingSpinner";
import RejectionModal from "../../components/RejectionModal";

export default function BiodataView() {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showExtendedFamily, setShowExtendedFamily] = useState(false);
  const [activeSection, setActiveSection] = useState("basic-info");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [notification, setNotification] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [isUnlockingContact, setIsUnlockingContact] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [monetizationEnabled, setMonetizationEnabled] = useState(
    monetizationConfig.isEnabled()
  );
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    profileId: null,
    profileName: "",
  });

  const { user: authUser, updateUser } = useAuth();

  // Check if this is admin view from URL params AND user has admin role
  const currentUser = authService.getCurrentUser();
  const isAdminView =
    searchParams.get("admin") === "true" && currentUser?.role === "admin";

  // Sidebar navigation sections
  const navigationSections = [
    { id: "basic-info", label: "Personal Information", icon: User },
    { id: "family-background", label: "Family Background", icon: Home },
    {
      id: "education-profession",
      label: "Education & Profession",
      icon: GraduationCap,
    },
    { id: "lifestyle-health", label: "Lifestyle & Health", icon: Activity },
    { id: "partner-preferences", label: "Partner Preferences", icon: Heart },
    { id: "declaration", label: "Declaration", icon: Shield },
    ...((profileId &&
      !isOwnProfile &&
      profile?.status === "approved" &&
      currentUser) ||
    isOwnProfile ||
    isAdminView
      ? [{ id: "contact-info", label: "Contact Information", icon: Contact }]
      : []),
  ];

  // Check if current user can view contact information
  const canViewContactInfo = useMemo(() => {
    if (!currentUser) return false;
    // Allow if user has BRACU email domains
    if (
      currentUser.email?.endsWith("@g.bracu.ac.bd") ||
      currentUser.email?.endsWith("@bracu.ac.bd")
    ) {
      return true;
    }
    // Allow if user is alumni verified
    if (currentUser.alumniVerified) {
      return true;
    }
    return false;
  }, [currentUser]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

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

  // Track active section based on scroll position - optimize with throttling
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = navigationSections.map((section) =>
            document.getElementById(section.id)
          );

          // Calculate scroll progress
          const winScroll =
            document.body.scrollTop || document.documentElement.scrollTop;
          const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
          const scrolled = (winScroll / height) * 100;
          setScrollProgress(scrolled);

          // Check if user has scrolled to the bottom
          const isAtBottom = winScroll + 10 >= height; // 10px threshold for bottom detection

          if (isAtBottom && navigationSections.length > 0) {
            // Set the last section as active when at the bottom
            setActiveSection(
              navigationSections[navigationSections.length - 1].id
            );
            ticking = false;
            return;
          }

          // Set active section - find the section with most visibility in viewport
          let newActiveSection = navigationSections[0]?.id || "basic-info";
          let maxVisibility = 0;

          const viewportTop = window.scrollY;
          const viewportBottom = viewportTop + window.innerHeight;

          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (section) {
              const rect = section.getBoundingClientRect();
              const sectionTop = rect.top + window.scrollY;
              const sectionBottom = sectionTop + rect.height;

              // Calculate how much of the section is visible in viewport
              const visibleTop = Math.max(sectionTop, viewportTop);
              const visibleBottom = Math.min(sectionBottom, viewportBottom);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const visibilityRatio = visibleHeight / rect.height;

              // Also consider sections that are about to come into view (early detection)
              const isNearViewport = sectionTop <= viewportTop + 150;

              if (
                (visibilityRatio > maxVisibility && visibilityRatio > 0.1) ||
                (isNearViewport && visibilityRatio > 0)
              ) {
                maxVisibility = visibilityRatio;
                newActiveSection = navigationSections[i].id;
              }
            }
          }

          setActiveSection(newActiveSection);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount to set initial active section
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navigationSections.length, profile]); // Include dependencies that affect navigationSections

  // Memoize profile ID and admin view to prevent unnecessary re-renders
  const memoizedProfileId = useMemo(() => profileId, [profileId]);
  const memoizedIsAdminView = useMemo(() => isAdminView, [isAdminView]);

  useEffect(() => {
    loadProfile();
    // Load user credits
    if (authUser) {
      setUserCredits(authUser.credits || 0);
    }
  }, [memoizedProfileId, memoizedIsAdminView]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();

      // Allow public viewing of profiles - don't redirect to login
      // Only redirect if trying to view own profile without being logged in
      if (!profileId && !currentUser) {
        navigate("/login");
        return;
      }

      // Security check: if admin=true in URL but user is not admin, redirect
      if (
        searchParams.get("admin") === "true" &&
        (!currentUser || currentUser.role !== "admin")
      ) {
        navigate("/search"); // Redirect to search page
        return;
      }

      // Determine if viewing own profile
      const viewingOwnProfile = !profileId;
      setIsOwnProfile(viewingOwnProfile);

      // OPTIMIZATION: Fetch profile and contact status in parallel
      let profilePromise;
      if (profileId) {
        // Check if this is admin view
        if (isAdminView && currentUser?.role === "admin") {
          // Use admin service to get profile (including pending ones)
          profilePromise = adminService.getProfileDetails(profileId);
        } else {
          // Regular user viewing approved profile (public access)
          profilePromise = profileService.getProfile(profileId);
        }
      } else {
        // Viewing own profile
        profilePromise = profileService.getCurrentUserProfile();
      }

      // Fetch contact status in parallel (only for authenticated users viewing other profiles)
      const shouldCheckContact =
        profileId && !viewingOwnProfile && !isAdminView && currentUser;
      const contactPromise = shouldCheckContact
        ? profileService.checkContactStatus(profileId).catch((error) => {
            console.error("Error checking contact status:", error);
            return { success: false };
          })
        : Promise.resolve({ success: false });

      // Wait for both requests to complete in parallel
      const [response, contactStatusResponse] = await Promise.all([
        profilePromise,
        contactPromise,
      ]);

      if (response.success) {
        setProfile(response.profile);

        // Process contact status if available (only for authenticated users)
        if (
          contactStatusResponse.success &&
          contactStatusResponse.isUnlocked &&
          currentUser
        ) {
          setContactInfo(contactStatusResponse.contactInfo);
          // Update user credits if available
          if (contactStatusResponse.remainingCredits !== undefined) {
            setUserCredits(contactStatusResponse.remainingCredits);
          }
        }
      } else {
        setError(
          profileId
            ? "Biodata not found."
            : "Biodata not found. Please create a biodata first."
        );
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load biodata");
    } finally {
      setLoading(false);
    }
  }, [memoizedProfileId, memoizedIsAdminView, authUser, navigate]);

  // Admin functions
  const handleApproveProfile = async (profileId) => {
    try {
      await adminService.approveProfile(profileId);
      showNotification("Biodata approved successfully", "success");
      // Reload profile to update status
      await loadProfile();
    } catch (error) {
      console.error("Failed to approve profile:", error);
      showNotification("Failed to approve profile. Please try again.", "error");
    }
  };

  const handleRejectProfile = async (profileId) => {
    const profileName = profile?.name || profile?.profileId || profileId;
    setRejectionModal({
      isOpen: true,
      profileId,
      profileName,
    });
  };

  const confirmRejection = async (reason) => {
    const { profileId } = rejectionModal;

    try {
      await adminService.rejectProfile(profileId, reason);
      showNotification("Profile rejected successfully!", "success");
      // Reload profile to update status
      await loadProfile();
    } catch (error) {
      console.error("Failed to reject profile:", error);
      showNotification("Failed to reject profile. Please try again.", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle contact unlock
  const handleUnlockContact = async () => {
    if (userCredits < 1) {
      showNotification(
        "You need at least 1 credit to unlock contact information. Please purchase credits.",
        "error"
      );
      return;
    }

    if (isOwnProfile) {
      showNotification(
        "You cannot unlock your own contact information.",
        "error"
      );
      return;
    }

    // Additional safety check: ensure we have a profileId from URL (not own profile)
    if (!profileId) {
      showNotification(
        "Cannot unlock contact information for this profile.",
        "error"
      );
      return;
    }

    try {
      setIsUnlockingContact(true);
      const response = await profileService.unlockContactInfo(profileId);

      if (response.success) {
        setContactInfo(response.contactInfo);
        setUserCredits(response.remainingCredits);

        // Update user in auth context
        const updatedUser = { ...authUser, credits: response.remainingCredits };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error("Error unlocking contact:", error);
      showNotification(
        error.response?.data?.message ||
          "Failed to unlock contact information. Please try again.",
        "error"
      );
    } finally {
      setIsUnlockingContact(false);
    }
  };

  // Handle alumni verification request
  const handleRequestVerification = async () => {
    try {
      const response = await profileService.requestVerification();
      if (response.success) {
        showNotification(
          "Verification request submitted successfully. Please send your proof to our Facebook page.",
          "success"
        );
        // Update user in auth context to reflect verificationRequest: true
        const updatedUser = { ...authUser, verificationRequest: true };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error("Error requesting verification:", error);
      showNotification(
        error.response?.data?.message ||
          "Failed to submit verification request. Please try again.",
        "error"
      );
    }
  };

  // Reusable components
  const SectionHeader = ({ icon: Icon, title, className = "" }) => (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {title}
        </h2>
      </div>
      <div className="h-px bg-gray-300 w-full"></div>
    </div>
  );

  // Helper function to check if a field has been edited
  const isFieldEdited = (fieldName) => {
    if (!isAdminView || !profile?.editedFields) return false;

    // Handle comma-separated field names (e.g., "brothersCount,sistersCount")
    if (fieldName && fieldName.includes(",")) {
      return fieldName
        .split(",")
        .some((field) => profile.editedFields.includes(field.trim()));
    }

    return profile.editedFields.includes(fieldName);
  };

  const InfoRow = ({ label, value, fieldName, className = "" }) => {
    if (!value) return null;
    const isEdited = fieldName && isFieldEdited(fieldName);

    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-3 py-4 border-b border-gray-100 last:border-b-0 ${className} ${
          isEdited ? "bg-amber-50 border-amber-200" : ""
        }`}
      >
        <dt className="text-base font-medium text-gray-700 flex items-center gap-2 leading-relaxed">
          {label}
          {isEdited && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              Edited
            </span>
          )}
        </dt>
        <dd className="text-base text-gray-900 md:col-span-2 leading-relaxed">
          {typeof value === "string" && value.length > 100 ? (
            <div
              className={`leading-relaxed whitespace-pre-line ${
                isEdited
                  ? "bg-amber-100 border border-amber-300 rounded-md p-4 text-sm"
                  : ""
              }`}
            >
              {value}
            </div>
          ) : (
            value
          )}
        </dd>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionSpinner text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Not Found
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(profileId ? "/search" : "/profile")}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
            >
              {profileId ? "Return to Search" : "Go to Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={
          profile
            ? `${profile.profileId || "Profile"} - BRACU Matrimony`
            : "Profile - BRACU Matrimony"
        }
        description={
          profile
            ? `View ${
                profile.profileId || "this"
              } profile on BRACU Matrimony. Age: ${
                profile.age || "N/A"
              }, Location: ${
                profile.district || "N/A"
              }. Find your perfect match.`
            : "View profile details on BRACU Matrimony"
        }
        keywords={`BRACU matrimony profile, ${
          profile?.district || ""
        }, marriage biodata`}
        type="article"
        url={`https://bracumatrimony.vercel.app/profile/${profileId || "view"}`}
        structuredData={
          profile
            ? {
                "@context": "https://schema.org",
                "@type": "Person",
                name: profile.profileId,
                description: `Matrimonial profile on BRACU Matrimony. Age: ${profile.age}, Location: ${profile.district}`,
                image:
                  profile.profilePicture ||
                  "https://res.cloudinary.com/dtv7wldhe/image/upload/v1759526635/icon_mauemy.png",
                url: `https://bracumatrimony.vercel.app/profile/${profileId}`,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: profile.district,
                  addressCountry: "Bangladesh",
                },
                alumniOf: {
                  "@type": "EducationalOrganization",
                  name: "BRAC University",
                },
              }
            : undefined
        }
      />
      <div className="min-h-screen bg-gray-50">
        {/* Rejection Modal */}
        <RejectionModal
          isOpen={rejectionModal.isOpen}
          onClose={() =>
            setRejectionModal({
              isOpen: false,
              profileId: null,
              profileName: "",
            })
          }
          onConfirm={confirmRejection}
          profileName={rejectionModal.profileName}
        />

        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-sm ${
              notification.type === "success"
                ? "bg-green-500 border border-green-600 text-white"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === "success" ? (
                <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-4 w-4 text-red-600" />
                </div>
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block fixed mt-20 ml-8 top-20 left-6 z-50 w-80 bg-white shadow-xl border border-gray-200 rounded-lg">
          {/* Progress bar */}
          <div
            className="absolute top-0 left-0 h-1 bg-gray-900 rounded-t-lg transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          ></div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Navigation
              </h3>
            </div>
          </div>

          <nav className="p-4 max-h-96 overflow-y-auto">
            <ul className="space-y-1">
              {navigationSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      activeSection === section.id
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <section.icon className="mr-3 h-4 w-4" />
                    <span className="truncate">{section.label}</span>
                    {activeSection === section.id && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="w-full">
          <div className="py-8 px-4 max-w-6xl mx-auto space-y-6 lg:pl-72">
            {/* Demo Profile Disclaimer Banner */}
            {(profile?.profileId === "BRACU9001" ||
              profile?.profileId === "BRACU9002") && (
              <div className="bg-yellow-400 border-4 border-black rounded-lg p-4">
                <div className="text-center">
                  <p className="text-black text-lg font-bold">
                    DEMO PROFILE - NOT REAL
                  </p>
                  <p className="text-black text-sm font-medium mt-1">
                    This is a sample biodata for demonstration only. All
                    information is fictional.
                  </p>
                </div>
              </div>
            )}

            {/* Status Banner for Own Profile */}
            {isOwnProfile && profile?.status === "pending_approval" && (
              <div className="bg-yellow-400 border-4 border-black rounded-lg p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <h3 className="text-black text-lg font-bold">
                      {profile?.editCount > 0
                        ? "Profile Under Review"
                        : "Awaiting Approval"}
                    </h3>
                    <p className="text-black text-sm font-medium mt-1">
                      {profile?.editCount > 0
                        ? "Your recent changes are being reviewed by our admin team. Your updated profile will be visible to others once approved."
                        : "Your biodata is currently under review by our admin team. We'll notify you via email once it's approved and live on the platform."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Banner for Rejected Profile */}
            {isOwnProfile && profile?.status === "rejected" && (
              <div className="bg-red-400 border-4 border-black rounded-lg p-4">
                <div className="text-center">
                  <h3 className="text-black text-lg font-bold">
                    Biodata Rejected
                  </h3>
                  <p className="text-black text-sm font-medium mt-1">
                    Your biodata has been rejected by the admin team.
                  </p>
                  {profile?.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md text-left">
                      <p className="text-black text-sm font-medium mt-1">
                        <strong>Reason:</strong> {profile.rejectionReason}
                      </p>
                    </div>
                  )}
                  <p className="text-black text-sm font-medium mt-1">
                    Please review the reason above and edit your biodata to
                    address the issues.
                  </p>
                </div>
              </div>
            )}

            {/* Profile Header Banner */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-stone-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Profile Photo */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0 mx-auto sm:mx-0 overflow-hidden">
                    {profile?.gender ? (
                      <img
                        src={
                          profile.gender.toLowerCase() === "male"
                            ? "https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583572/male_d4wuwd.png"
                            : "https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583575/female_p0k4x3.png"
                        }
                        alt={`${profile.gender} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Profile Information */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {/* Top Row: Name and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="flex-1 text-center sm:text-left">
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                            {profile?.profileId || "ID not available"}
                          </h1>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm sm:text-base text-gray-700 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                              {profile?.age
                                ? `${profile.age} years`
                                : "Age not provided"}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>
                              {profile?.gender || "Gender not specified"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
                          {isOwnProfile && (
                            <button
                              onClick={() => navigate("/profile/edit")}
                              className="flex items-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer text-sm sm:text-base"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Edit Profile
                            </button>
                          )}

                          {!isOwnProfile &&
                            !isAdminView &&
                            profileId &&
                            currentUser && (
                              <BookmarkButton profileId={profileId} />
                            )}

                          {isAdminView && currentUser?.role === "admin" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/profile/edit/${profile.profileId}?admin=true`
                                  )
                                }
                                className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs sm:text-sm"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Edit
                              </button>
                              {profile?.status === "pending_approval" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApproveProfile(profile.profileId)
                                    }
                                    className="flex items-center px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-xs sm:text-sm"
                                  >
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectProfile(profile.profileId)
                                    }
                                    className="flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Additional Info */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            {profile?.presentAddressDivision &&
                            profile?.presentAddressDistrict
                              ? `${profile.presentAddressDistrict}, ${profile.presentAddressDivision}`
                              : "Location not provided"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                            {profile?.profession || "Profession not provided"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                            {profile?.graduationSubject ||
                              "Education not provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div
              id="basic-info"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader icon={User} title="Personal Information" />
              <dl className="space-y-0">
                <InfoRow
                  label="Age"
                  value={profile?.age ? `${profile.age} years` : null}
                  fieldName="age"
                />
                <InfoRow
                  label="Height"
                  value={profile?.height}
                  fieldName="height"
                />
                <InfoRow
                  label="Weight"
                  value={profile?.weight}
                  fieldName="weight"
                />
                <InfoRow
                  label="Skin Tone"
                  value={profile?.skinTone}
                  fieldName="skinTone"
                />
                <InfoRow
                  label="Marital Status"
                  value={profile?.maritalStatus}
                  fieldName="maritalStatus"
                />
                <InfoRow
                  label="Present Division"
                  value={profile?.presentAddressDivision}
                  fieldName="presentAddressDivision"
                />
                <InfoRow
                  label="Present District"
                  value={profile?.presentAddressDistrict}
                  fieldName="presentAddressDistrict"
                />
                <InfoRow
                  label="Permanent Division"
                  value={profile?.permanentAddressDivision}
                  fieldName="permanentAddressDivision"
                />
                <InfoRow
                  label="Permanent District"
                  value={profile?.permanentAddressDistrict}
                  fieldName="permanentAddressDistrict"
                />
              </dl>
            </div>

            {/* Family Background Section */}
            <div
              id="family-background"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader icon={Home} title="Family Background" />
              <dl className="space-y-0">
                <InfoRow
                  label="Father's Status"
                  value={profile?.fatherAlive}
                  fieldName="fatherAlive"
                />
                <InfoRow
                  label="Father's Occupation"
                  value={profile?.fatherOccupation}
                  fieldName="fatherOccupation"
                />
                <InfoRow
                  label="Mother's Status"
                  value={profile?.motherAlive}
                  fieldName="motherAlive"
                />
                <InfoRow
                  label="Mother's Occupation"
                  value={profile?.motherOccupation}
                  fieldName="motherOccupation"
                />
                <InfoRow
                  label="Siblings"
                  value={
                    profile?.brothersCount || profile?.sistersCount
                      ? `${profile?.brothersCount || 0} Brother(s), ${
                          profile?.sistersCount || 0
                        } Sister(s)`
                      : null
                  }
                  fieldName="brothersCount,sistersCount"
                />
                <InfoRow
                  label="Economic Condition"
                  value={profile?.familyEconomicCondition}
                  fieldName="familyEconomicCondition"
                />
              </dl>

              {/* Family Members Occupations */}
              {(profile?.brother1Occupation ||
                profile?.sister1Occupation ||
                profile?.uncle1Occupation) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Family Members Occupations
                    </h3>
                    <button
                      onClick={() => setShowExtendedFamily(!showExtendedFamily)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      {showExtendedFamily ? (
                        <>
                          Hide Details <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Show More <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {showExtendedFamily && (
                    <dl className="divide-y divide-gray-100">
                      {/* Brothers */}
                      {Array.from(
                        { length: parseInt(profile?.brothersCount) || 0 },
                        (_, index) => {
                          const occupation =
                            profile?.[`brother${index + 1}Occupation`];
                          return occupation ? (
                            <InfoRow
                              key={`brother-${index + 1}`}
                              label={`Brother ${index + 1}`}
                              value={occupation}
                            />
                          ) : null;
                        }
                      )}

                      {/* Sisters */}
                      {Array.from(
                        { length: parseInt(profile?.sistersCount) || 0 },
                        (_, index) => {
                          const occupation =
                            profile?.[`sister${index + 1}Occupation`];
                          return occupation ? (
                            <InfoRow
                              key={`sister-${index + 1}`}
                              label={`Sister ${index + 1}`}
                              value={occupation}
                            />
                          ) : null;
                        }
                      )}

                      {/* Uncles */}
                      {Array.from(
                        { length: parseInt(profile?.unclesCount) || 0 },
                        (_, index) => {
                          const occupation =
                            profile?.[`uncle${index + 1}Occupation`];
                          return occupation ? (
                            <InfoRow
                              key={`uncle-${index + 1}`}
                              label={`Uncle ${index + 1}`}
                              value={occupation}
                            />
                          ) : null;
                        }
                      )}
                    </dl>
                  )}
                </div>
              )}
            </div>

            {/* Education & Profession Section */}
            <div
              id="education-profession"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader
                icon={GraduationCap}
                title="Education & Profession"
              />
              <dl className="space-y-0">
                <InfoRow
                  label="Education Medium"
                  value={profile?.educationMedium}
                  fieldName="educationMedium"
                />
                <InfoRow
                  label="HSC/Equivalent Year"
                  value={profile?.intermediatePassingYear}
                  fieldName="intermediatePassingYear"
                />
                <InfoRow
                  label="HSC Group"
                  value={profile?.intermediateGroup}
                  fieldName="intermediateGroup"
                />
                <InfoRow
                  label="HSC Result"
                  value={profile?.intermediateResult}
                  fieldName="intermediateResult"
                />
                <InfoRow
                  label="SSC/Equivalent Year"
                  value={profile?.hscPassingYear}
                  fieldName="hscPassingYear"
                />
                <InfoRow
                  label="SSC Group"
                  value={profile?.hscGroup}
                  fieldName="hscGroup"
                />
                <InfoRow
                  label="SSC Result"
                  value={profile?.hscResult}
                  fieldName="hscResult"
                />
                <InfoRow
                  label="Graduation Subject"
                  value={profile?.graduationSubject}
                  fieldName="graduationSubject"
                />
                <InfoRow
                  label="Current Study Year"
                  value={profile?.currentStudyYear}
                  fieldName="currentStudyYear"
                />
                <InfoRow
                  label="Other Qualifications"
                  value={profile?.otherEducationalQualifications}
                  fieldName="otherEducationalQualifications"
                />
                <InfoRow
                  label="Profession"
                  value={profile?.profession}
                  fieldName="profession"
                />
                <InfoRow
                  label="Monthly Income"
                  value={profile?.monthlyIncome}
                  fieldName="monthlyIncome"
                />
                <InfoRow
                  label="Profession Description"
                  value={profile?.professionDescription}
                  fieldName="professionDescription"
                />
              </dl>
            </div>

            {/* Lifestyle & Health Section */}
            <div
              id="lifestyle-health"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader icon={Activity} title="Lifestyle & Health" />
              <dl className="space-y-0">
                <InfoRow
                  label="Religion"
                  value={profile?.religion}
                  fieldName="religion"
                />
                <InfoRow
                  label="Religious Practices"
                  value={profile?.religiousPractices}
                  fieldName="religiousPractices"
                />
                <InfoRow
                  label="Practice Frequency"
                  value={profile?.practiceFrequency}
                  fieldName="practiceFrequency"
                />
                <InfoRow
                  label="Physical Illness"
                  value={profile?.mentalPhysicalIllness}
                  fieldName="mentalPhysicalIllness"
                />
                <InfoRow
                  label="Hobbies & Interests"
                  value={profile?.hobbiesLikesDislikesDreams}
                  fieldName="hobbiesLikesDislikesDreams"
                />
                {/* Partner preference fields - Show only for females */}
                {profile?.gender === "Female" && (
                  <>
                    <InfoRow
                      label="Partner Study After Marriage"
                      value={profile?.partnerStudyAfterMarriage}
                      fieldName="partnerStudyAfterMarriage"
                    />
                    <InfoRow
                      label="Partner Job After Marriage"
                      value={profile?.partnerJobAfterMarriage}
                      fieldName="partnerJobAfterMarriage"
                    />
                    <InfoRow
                      label="Preferred Living Location"
                      value={profile?.preferredLivingLocation}
                      fieldName="preferredLivingLocation"
                    />
                  </>
                )}
              </dl>
            </div>

            {/* Partner Preferences Section */}
            <div
              id="partner-preferences"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader icon={Heart} title="Partner Preferences" />
              <dl className="space-y-0">
                <InfoRow
                  label="Preferred Age"
                  value={profile?.partnerAgePreference}
                  fieldName="partnerAgePreference"
                />
                <InfoRow
                  label="Preferred Height"
                  value={profile?.partnerHeight}
                  fieldName="partnerHeight"
                />
                <InfoRow
                  label="Preferred Skin Tone"
                  value={profile?.partnerSkinTone}
                  fieldName="partnerSkinTone"
                />
                <InfoRow
                  label="Preferred Marital Status"
                  value={profile?.partnerMaritalStatus}
                  fieldName="partnerMaritalStatus"
                />
                <InfoRow
                  label="Preferred Education"
                  value={profile?.partnerEducation}
                  fieldName="partnerEducation"
                />
                <InfoRow
                  label="Preferred Profession"
                  value={profile?.partnerProfession}
                  fieldName="partnerProfession"
                />
                <InfoRow
                  label="Preferred Economic Condition"
                  value={profile?.partnerEconomicCondition}
                  fieldName="partnerEconomicCondition"
                />
                <InfoRow
                  label="Preferred District/Region"
                  value={profile?.partnerDistrictRegion}
                  fieldName="partnerDistrictRegion"
                />
                <InfoRow
                  label="Specific Characteristics"
                  value={profile?.specificCharacteristics}
                  fieldName="specificCharacteristics"
                />
              </dl>
            </div>

            {/* Declaration Section */}
            <div
              id="declaration"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
            >
              <SectionHeader icon={Shield} title="Declaration" />
              <dl className="space-y-0">
                <InfoRow
                  label="Guardian Knowledge"
                  value={profile?.guardianKnowledge || "Not provided"}
                  fieldName="guardianKnowledge"
                />
                <InfoRow
                  label="Information Truthfulness"
                  value={profile?.informationTruthfulness || "Not provided"}
                  fieldName="informationTruthfulness"
                />
                <InfoRow
                  label="False Information Agreement"
                  value={profile?.falseInformationAgreement || "Not provided"}
                  fieldName="falseInformationAgreement"
                />
              </dl>
            </div>

            {/* Contact Information Section - Show for own profile, other users' approved profiles, or admin view */}
            {(isOwnProfile ||
              (profileId &&
                !isOwnProfile &&
                profile?.status === "approved" &&
                currentUser) ||
              isAdminView) && (
              <div
                id="contact-info"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
              >
                <SectionHeader icon={Contact} title="Contact Information" />

                {/* Own Profile View - Always show contact info with edit option */}
                {isOwnProfile ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4"></div>
                    <div>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                        {profile?.contactInformation ||
                          "No contact information provided. Click Edit to add your contact details."}
                      </p>
                    </div>
                  </div>
                ) : isAdminView && currentUser?.role === "admin" ? (
                  <div className="bg-gradient-to-br from-green-50 to-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4"></div>
                    <div>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                        {profile?.contactInformation ||
                          "No contact information provided by the user."}
                      </p>
                    </div>
                  </div>
                ) : !canViewContactInfo ? (
                  /* Restriction for non-BRACU/non-alumni users */
                  <div className="text-center py-6">
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200">
                      <Lock className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-rose-800 mb-3">
                        Contact Information Restricted
                      </h3>
                      <p className="text-base text-rose-700 mb-4 leading-relaxed">
                        You cannot see the contact information without
                        (g.bracu.ac.bd) or (bracu.ac.bd). If you are alumni,
                        make a request for verification.
                      </p>
                      {!currentUser?.verificationRequest ? (
                        <button
                          onClick={handleRequestVerification}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer mr-3"
                        >
                          <Shield className="w-4 h-4" />
                          Request Alumni Verification
                        </button>
                      ) : (
                        <div className="text-center mb-4">
                          <span className="text-lg font-bold text-green-800 block mb-2">
                            Verification Request Submitted
                          </span>
                          <p className="text-base text-green-700 font-medium">
                            Please send your proof to our Facebook page.
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => navigate("/profile")}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        Go to Profile
                      </button>
                    </div>
                  </div>
                ) : monetizationEnabled ? (
                  /* Credit-based unlock system */
                  !contactInfo ? (
                    <div className="text-center py-6">
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200">
                        <Lock className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-rose-800 mb-3">
                          Contact Information Locked
                        </h3>
                        <p className="text-base text-rose-700 mb-4 leading-relaxed">
                          Use 1 credit to unlock the contact information for
                          this profile.
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-4">
                          <CreditCard className="w-4 h-4 text-rose-500" />
                          <span className="text-base font-semibold text-rose-800">
                            Your Credits: {userCredits}
                          </span>
                        </div>

                        {userCredits >= 1 ? (
                          <button
                            onClick={handleUnlockContact}
                            disabled={isUnlockingContact}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isUnlockingContact ? (
                              <>
                                <ButtonSpinner />
                                Unlocking...
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                Unlock Contact (1 Credit)
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-base text-red-700 font-medium">
                              Insufficient credits. You need at least 1 credit.
                            </p>
                            <button
                              onClick={() => navigate("/credits")}
                              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                            >
                              <CreditCard className="w-4 h-4" />
                              Purchase Credits
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {contactInfo ||
                            profile?.contactInformation ||
                            "No contact information provided by the user."}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  /* Free access mode - Show contact information directly */
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                        {contactInfo ||
                          profile?.contactInformation ||
                          "No contact information provided by the user."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show login prompt for contact info when not authenticated */}
            {profileId &&
              !isOwnProfile &&
              profile?.status === "approved" &&
              !currentUser && (
                <div
                  id="contact-info"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
                >
                  <SectionHeader icon={Contact} title="Contact Information" />
                  <div className="text-center py-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <Lock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        Login Required
                      </h3>
                      <p className="text-base text-blue-700 mb-4 leading-relaxed">
                        Please log in to view and unlock contact information for
                        this profile.
                      </p>
                      <button
                        onClick={() => navigate("/login")}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                      >
                        <Contact className="w-4 h-4" />
                        Login to View Contact Info
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </main>
      </div>
    </>
  );
}
