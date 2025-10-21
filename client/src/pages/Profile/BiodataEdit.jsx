import { useState, useEffect } from "react";
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
  X,
  Contact,
  Check,
} from "lucide-react";
import { SectionSpinner } from "../../components/LoadingSpinner";
import profileService from "../../services/profileService";
import adminService from "../../services/adminService";
import authService from "../../services/authService";
import {
  locationsByDivision,
  divisions,
  districtsByDivision,
} from "../../utils/locationData";

const DROPDOWN_OPTIONS = {
  height: [
    "4'6\"",
    "4'7\"",
    "4'8\"",
    "4'9\"",
    "4'10\"",
    "4'11\"",
    "5'0\"",
    "5'1\"",
    "5'2\"",
    "5'3\"",
    "5'4\"",
    "5'5\"",
    "5'6\"",
    "5'7\"",
    "5'8\"",
    "5'9\"",
    "5'10\"",
    "5'11\"",
    "6'0\"",
    "6'1\"",
    "6'2\"",
    "6'3\"",
    "6'4\"",
  ],
  skinTone: ["Fair", "Medium", "Dark", "Very Fair", "Wheatish"],
  weight: Array.from({ length: 101 }, (_, i) => `${i + 40} kg`),
  monthlyIncome: [
    "No Income",
    "Below 20,000 BDT",
    "20,000 - 40,000 BDT",
    "40,000 - 60,000 BDT",
    "60,000 - 80,000 BDT",
    "80,000 - 100,000 BDT",
    "Above 100,000 BDT",
    "Prefer not to say",
  ],
  educationMedium: ["Bengali", "English"],
  familyEconomicCondition: ["Lower", "Middle", "Upper-middle", "Affluent"],
  fatherMotherAlive: ["Yes", "No"],
  maritalStatus: ["Never Married", "Divorced", "Widowed"],
  partnerMaritalStatus: ["Single", "Divorced", "Widowed"],
  practiceFrequency: ["Daily", "Weekly", "Monthly", "Occasionally", "Rarely"],
  religion: ["Muslim", "Hindu", "Christian", "Buddhist", "Other"],
};

// FIXED: Move EditableField outside the component to prevent re-creation
const EditableField = ({
  label,
  name,
  value,
  type = "text",
  options = [],
  className = "",
  placeholder = "",
  rows = 1,
  required = false,
  handleChange,
  validationErrors,
}) => {
  const hasError = validationErrors[name];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-3 py-4 border-b border-gray-100 last:border-b-0 ${className}`}
    >
      <dt className="text-base font-medium text-gray-700 flex items-center leading-relaxed">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className="md:col-span-2">
        {type === "select" ? (
          <select
            name={name}
            value={value || ""}
            onChange={handleChange}
            className={`w-full px-4 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white transition-colors duration-200 leading-relaxed ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            name={name}
            value={value || ""}
            onChange={handleChange}
            rows={rows}
            placeholder={placeholder}
            className={`w-full px-4 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-vertical transition-colors duration-200 leading-relaxed ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200 leading-relaxed ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
          />
        )}
        {hasError && (
          <p className="mt-2 text-base text-red-700 font-medium">
            {validationErrors[name]}
          </p>
        )}
      </dd>
    </div>
  );
};

// Location Dropdown Component for handling optgroups
const LocationDropdown = ({
  label,
  name,
  value,
  required = false,
  handleChange,
  validationErrors,
  className = "",
}) => {
  const hasError = validationErrors[name];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-3 py-4 border-b border-gray-100 last:border-b-0 ${className}`}
    >
      <dt className="text-base font-medium text-gray-700 flex items-center leading-relaxed">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className="md:col-span-2">
        <select
          name={name}
          value={value || ""}
          onChange={handleChange}
          className={`w-full px-4 py-3 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white transition-colors duration-200 leading-relaxed ${
            hasError ? "border-red-300" : "border-gray-300"
          }`}
        >
          {locationsByDivision[""].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {Object.entries(locationsByDivision).map(([division, locations]) => {
            if (division === "") return null;
            return (
              <optgroup key={division} label={division}>
                {locations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{validationErrors[name]}</p>
        )}
      </dd>
    </div>
  );
};

// Division Dropdown Component
const DivisionDropdown = ({
  label,
  name,
  value,
  required = false,
  handleChange,
  validationErrors,
  className = "",
  onDivisionChange = null,
}) => {
  const hasError = validationErrors[name];

  const handleDivisionChange = (e) => {
    handleChange(e);
    if (onDivisionChange) {
      onDivisionChange(e);
    }
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-gray-100 last:border-b-0 ${className}`}
    >
      <dt className="text-sm font-medium text-gray-600 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className="md:col-span-2">
        <select
          name={name}
          value={value || ""}
          onChange={handleDivisionChange}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white transition-colors duration-200 ${
            hasError ? "border-red-300" : "border-gray-300"
          }`}
        >
          {divisions.map((division) => (
            <option key={division.value} value={division.value}>
              {division.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{validationErrors[name]}</p>
        )}
      </dd>
    </div>
  );
};

// District Dropdown Component
const DistrictDropdown = ({
  label,
  name,
  value,
  required = false,
  handleChange,
  validationErrors,
  className = "",
  selectedDivision = "",
}) => {
  const hasError = validationErrors[name];
  const isDisabled = !selectedDivision;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-gray-100 last:border-b-0 ${className}`}
    >
      <dt className="text-sm font-medium text-gray-600 flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className="md:col-span-2">
        <select
          name={name}
          value={value || ""}
          onChange={handleChange}
          disabled={isDisabled}
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200 ${
            hasError ? "border-red-300" : "border-gray-300"
          } ${isDisabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
        >
          {(
            districtsByDivision[selectedDivision] || [
              { value: "", label: "Select Division First" },
            ]
          ).map((district) => (
            <option key={district.value} value={district.value}>
              {district.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{validationErrors[name]}</p>
        )}
      </dd>
    </div>
  );
};

export default function BiodataEdit() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showExtendedFamily, setShowExtendedFamily] = useState(false);
  const [activeSection, setActiveSection] = useState("basic-info");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [searchParams] = useSearchParams();

  const isAdminMode = searchParams.get("admin") === "true";
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

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
    { id: "contact-info", label: "Contact Information", icon: Contact },
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Update active section immediately on manual navigation
      setActiveSection(sectionId);

      // Calculate the position with a manual offset for the fixed sidebar
      const offsetTop = element.offsetTop - 80; // Adjust for header and padding
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationSections.map((section) => section.id);

      // Calculate scroll progress
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(Math.min(progress, 100));

      // Check if user has scrolled to the bottom
      const isAtBottom = scrollTop + 10 >= scrollHeight; // 10px threshold for bottom detection

      if (isAtBottom && sections.length > 0) {
        // Set the last section as active when at the bottom
        setActiveSection(sections[sections.length - 1]);
        return;
      }

      let currentSection = sections[0];

      // Find the currently visible section
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider a section active if it's in the top half of the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
            currentSection = sectionId;
          }
        }
      }

      setActiveSection(currentSection);
    };

    // Debounce scroll handler for better performance
    let scrollTimeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 50);
    };

    window.addEventListener("scroll", debouncedScrollHandler);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", debouncedScrollHandler);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    loadProfile();
  }, [isAdminMode, profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if admin mode is valid
      if (isAdminMode && !isAdmin) {
        setError("Unauthorized access");
        navigate("/admin");
        return;
      }

      let response;
      if (isAdminMode && profileId) {
        // Admin loading any profile
        response = await adminService.getProfileDetails(profileId);
      } else {
        // Regular user loading their own profile
        response = await profileService.getCurrentUserProfile();
      }

      if (response.success) {
        setProfile(response.profile);

        // Process the profile data to extract age preferences
        const processedProfile = { ...response.profile };

        // Extract min/max age preferences from the combined field if it exists
        if (
          processedProfile.partnerAgePreference &&
          !processedProfile.partnerAgePreferenceMin &&
          !processedProfile.partnerAgePreferenceMax
        ) {
          const ageMatch =
            processedProfile.partnerAgePreference.match(/(\d+)\s*-\s*(\d+)/);
          if (ageMatch) {
            processedProfile.partnerAgePreferenceMin = ageMatch[1];
            processedProfile.partnerAgePreferenceMax = ageMatch[2];
          }
        }

        // Extract min/max height preferences from the combined field if it exists
        if (
          processedProfile.partnerHeight &&
          !processedProfile.partnerHeightMin &&
          !processedProfile.partnerHeightMax
        ) {
          // Match height patterns like "5'6\" - 5'8\"" or "5'6\" - 5'5\" feet"
          const heightMatch = processedProfile.partnerHeight.match(
            /([\d'"]+ ?["']?)\s*-\s*([\d'"]+ ?["']?)/
          );
          if (heightMatch) {
            processedProfile.partnerHeightMin = heightMatch[1].trim();
            processedProfile.partnerHeightMax = heightMatch[2].trim();
          }
        }

        setFormData(processedProfile);
      } else {
        setError("Biodata not found. Please create a biodata first.");
        showNotification(
          "Biodata not found. Please create a biodata first.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load biodata");
      showNotification("Failed to load biodata", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: value,
      };

      // Clear unused occupation fields when count is reduced
      if (name === "brothersCount") {
        const count = parseInt(value) || 0;
        for (let i = count + 1; i <= 10; i++) {
          // Clear up to 10 possible fields
          delete newFormData[`brother${i}Occupation`];
        }
      } else if (name === "sistersCount") {
        const count = parseInt(value) || 0;
        for (let i = count + 1; i <= 10; i++) {
          // Clear up to 10 possible fields
          delete newFormData[`sister${i}Occupation`];
        }
      } else if (name === "unclesCount") {
        const count = parseInt(value) || 0;
        for (let i = count + 1; i <= 10; i++) {
          // Clear up to 10 possible fields
          delete newFormData[`uncle${i}Occupation`];
        }
      }

      return newFormData;
    });

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Special handlers for division changes to reset corresponding district fields
  const handlePresentDivisionChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      presentAddressDivision: e.target.value,
      presentAddressDistrict: "", // Reset district when division changes
    }));

    // Clear validation errors
    if (validationErrors.presentAddressDivision) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.presentAddressDivision;
        delete newErrors.presentAddressDistrict; // Also clear district error
        return newErrors;
      });
    }
  };

  const handlePermanentDivisionChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      permanentAddressDivision: e.target.value,
      permanentAddressDistrict: "", // Reset district when division changes
    }));

    // Clear validation errors
    if (validationErrors.permanentAddressDivision) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.permanentAddressDivision;
        delete newErrors.permanentAddressDistrict; // Also clear district error
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setValidationErrors({});

      // Prepare the data for submission by combining preferences
      const submissionData = { ...formData };

      // Combine partnerAgePreferenceMin and partnerAgePreferenceMax into partnerAgePreference
      if (
        submissionData.partnerAgePreferenceMin &&
        submissionData.partnerAgePreferenceMax
      ) {
        submissionData.partnerAgePreference = `${submissionData.partnerAgePreferenceMin} - ${submissionData.partnerAgePreferenceMax} years`;
      }

      // Combine partnerHeightMin and partnerHeightMax into partnerHeight
      if (submissionData.partnerHeightMin && submissionData.partnerHeightMax) {
        submissionData.partnerHeight = `${submissionData.partnerHeightMin} - ${submissionData.partnerHeightMax}`;
      }

      let response;
      if (isAdminMode) {
        // Admin updating any profile
        response = await adminService.updateProfile(
          profileId || profile.profileId,
          submissionData
        );
      } else {
        // Regular user updating their own profile
        response = await profileService.updateProfile(submissionData);
      }

      if (response.success) {
        if (isAdminMode) {
          showNotification("Profile updated successfully", "success");
          setTimeout(() => {
            navigate(
              `/profile/view/${profileId || profile.profileId}?admin=true`
            );
          }, 2000);
        } else if (response.requiresReview) {
          showNotification(
            "Your changes are now under admin review",
            "success"
          );
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        } else {
          showNotification(
            "Your changes are now under admin review",
            "success"
          );
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        }
      } else {
        showNotification(
          response.message || "Failed to update profile",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error response data:", error.response?.data);
      console.error(
        "Full error response:",
        JSON.stringify(error.response?.data, null, 2)
      );

      // Check if the error contains validation details
      if (error.response && error.response.data && error.response.data.errors) {
        const errors = error.response.data.errors;
        let errorMessages = [];

        // Handle formatted validation errors from server
        if (typeof errors === "object") {
          Object.keys(errors).forEach((field) => {
            // Check if it's the formatted error structure (direct field-to-message mapping)
            if (typeof errors[field] === "string") {
              errorMessages.push(errors[field]);
            }
            // Handle Mongoose validation errors (field-to-object mapping)
            else if (errors[field] && errors[field].message) {
              errorMessages.push(errors[field].message);
            }
          });

          // Show all validation errors as a single toast message
          if (errorMessages.length > 0) {
            setValidationErrors({}); // Clear validation errors state
            showNotification(errorMessages.join(". "), "error");
          }
        } else {
          showNotification(
            error.response.data.message || "Failed to update profile",
            "error"
          );
        }
      } else {
        showNotification(error.message || "Failed to update profile", "error");
      }
    } finally {
      setSaving(false);
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

  const ReadOnlyField = ({ label, value, className = "" }) => {
    if (!value) return null;
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-3 py-4 border-b border-gray-100 last:border-b-0 ${className}`}
      >
        <dt className="text-base font-medium text-gray-700 leading-relaxed">
          {label}
        </dt>
        <dd className="text-base text-gray-900 md:col-span-2 leading-relaxed">
          <span className="px-4 py-3 bg-gray-50 rounded-md text-gray-800 text-base inline-block">
            {value}
          </span>
        </dd>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SectionSpinner text="Loading profile..." />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Not Found
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-green-500 border border-green-600 text-white"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === "success" && (
              <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
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
            <h3 className="text-sm font-semibold text-gray-900">Navigation</h3>
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
        <form
          onSubmit={handleSubmit}
          className="py-4 sm:py-6 md:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:pl-72"
        >
          {/* Admin Review Warning or Admin Mode Indicator */}
          {profile && (
            <div
              className={`border-4 border-black rounded-lg p-4 ${
                isAdminMode ? "bg-blue-400" : "bg-yellow-400"
              }`}
            >
              <div className="text-center">
                <p className="text-black text-lg font-bold">
                  {isAdminMode
                    ? "Admin Profile Editing"
                    : "Admin Review Required"}
                </p>
                <p className="text-black text-sm font-medium mt-1">
                  {isAdminMode
                    ? "You are editing this profile as an administrator. Changes will be applied directly."
                    : 'Any changes you make to your biodata will require admin approval before becoming visible to other users. Your biodata will show as "Pending Approval" until approved.'}
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
                  {formData?.gender ? (
                    <img
                      src={
                        formData.gender.toLowerCase() === "male"
                          ? "https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583572/male_d4wuwd.png"
                          : "https://res.cloudinary.com/dtv7wldhe/image/upload/v1759583575/female_p0k4x3.png"
                      }
                      alt={`${formData.gender} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  )}
                </div>

                {/* Profile Information */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Top Row: Name and Cancel Button */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                          {formData?.name ||
                            profile?.name ||
                            profile?.profileId ||
                            "Loading..."}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm sm:text-base text-gray-700 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            {formData?.age
                              ? `${formData.age} years`
                              : "Age not provided"}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>
                            {formData?.gender || "Gender not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer text-sm sm:text-base"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Cancel
                      </button>
                    </div>

                    {/* Bottom Row: Additional Info */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formData?.presentAddressDivision &&
                          formData?.presentAddressDistrict
                            ? `${formData.presentAddressDistrict}, ${formData.presentAddressDivision}`
                            : "Location not provided"}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formData?.profession || "Profession not provided"}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formData?.graduationSubject ||
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
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={User} title="Personal Information" />
            <div className="space-y-0">
              <EditableField
                label="Age"
                name="age"
                value={formData.age}
                type="number"
                placeholder="Enter your age"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Height"
                name="height"
                value={formData.height}
                type="select"
                options={DROPDOWN_OPTIONS.height}
                placeholder="Select height"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Weight"
                name="weight"
                value={formData.weight}
                type="select"
                options={DROPDOWN_OPTIONS.weight}
                placeholder="Select weight"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Skin Tone"
                name="skinTone"
                value={formData.skinTone}
                type="select"
                options={DROPDOWN_OPTIONS.skinTone}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Marital Status"
                name="maritalStatus"
                value={formData.maritalStatus}
                type="select"
                options={DROPDOWN_OPTIONS.maritalStatus}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <DivisionDropdown
                label="Present Division"
                name="presentAddressDivision"
                value={formData.presentAddressDivision}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
                onDivisionChange={handlePresentDivisionChange}
              />
              <DistrictDropdown
                label="Present District"
                name="presentAddressDistrict"
                value={formData.presentAddressDistrict}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
                selectedDivision={formData.presentAddressDivision}
              />
              <DivisionDropdown
                label="Permanent Division"
                name="permanentAddressDivision"
                value={formData.permanentAddressDivision}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
                onDivisionChange={handlePermanentDivisionChange}
              />
              <DistrictDropdown
                label="Permanent District"
                name="permanentAddressDistrict"
                value={formData.permanentAddressDistrict}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
                selectedDivision={formData.permanentAddressDivision}
              />
            </div>
          </div>

          {/* Family Background Section */}
          <div
            id="family-background"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={Home} title="Family Background" />
            <div className="space-y-0">
              <EditableField
                label="Father's Status"
                name="fatherAlive"
                value={formData.fatherAlive}
                type="select"
                options={DROPDOWN_OPTIONS.fatherMotherAlive}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Father's Occupation"
                name="fatherOccupation"
                value={formData.fatherOccupation}
                placeholder="Enter father's occupation"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Mother's Status"
                name="motherAlive"
                value={formData.motherAlive}
                type="select"
                options={DROPDOWN_OPTIONS.fatherMotherAlive}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Mother's Occupation"
                name="motherOccupation"
                value={formData.motherOccupation}
                placeholder="Enter mother's occupation"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Brothers Count"
                name="brothersCount"
                value={formData.brothersCount}
                type="number"
                placeholder="Number of brothers"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Sisters Count"
                name="sistersCount"
                value={formData.sistersCount}
                type="number"
                placeholder="Number of sisters"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Uncles Count"
                name="unclesCount"
                value={formData.unclesCount}
                type="number"
                placeholder="Number of uncles"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />

              {Array.from(
                { length: parseInt(formData.brothersCount) || 0 },
                (_, index) => (
                  <EditableField
                    key={`brother-${index + 1}`}
                    label={`Brother ${index + 1} Occupation`}
                    name={`brother${index + 1}Occupation`}
                    value={formData[`brother${index + 1}Occupation`] || ""}
                    placeholder={`Enter brother ${index + 1}'s occupation`}
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                )
              )}
              {Array.from(
                { length: parseInt(formData.sistersCount) || 0 },
                (_, index) => (
                  <EditableField
                    key={`sister-${index + 1}`}
                    label={`Sister ${index + 1} Occupation`}
                    name={`sister${index + 1}Occupation`}
                    value={formData[`sister${index + 1}Occupation`] || ""}
                    placeholder={`Enter sister ${index + 1}'s occupation`}
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                )
              )}
              {Array.from(
                { length: parseInt(formData.unclesCount) || 0 },
                (_, index) => (
                  <EditableField
                    key={`uncle-${index + 1}`}
                    label={`Uncle ${index + 1} Occupation`}
                    name={`uncle${index + 1}Occupation`}
                    value={formData[`uncle${index + 1}Occupation`] || ""}
                    placeholder={`Enter uncle ${index + 1}'s occupation`}
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                )
              )}

              <EditableField
                label="Economic Condition"
                name="familyEconomicCondition"
                value={formData.familyEconomicCondition}
                type="select"
                options={DROPDOWN_OPTIONS.familyEconomicCondition}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
            </div>
          </div>

          {/* Education & Profession Section */}
          <div
            id="education-profession"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader
              icon={GraduationCap}
              title="Education & Profession"
            />
            <div className="space-y-0">
              <EditableField
                label="Education Medium"
                name="educationMedium"
                value={formData.educationMedium}
                type="select"
                options={DROPDOWN_OPTIONS.educationMedium}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="HSC/Equivalent Year"
                name="intermediatePassingYear"
                value={formData.intermediatePassingYear}
                type="number"
                placeholder="HSC passing year"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="HSC Group"
                name="intermediateGroup"
                value={formData.intermediateGroup}
                type="select"
                options={["Science", "Business Studies", "Humanities"]}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="HSC Result"
                name="intermediateResult"
                value={formData.intermediateResult}
                placeholder="e.g., GPA 5.00"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="SSC/Equivalent Year"
                name="hscPassingYear"
                value={formData.hscPassingYear}
                type="number"
                placeholder="SSC passing year"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="SSC Group"
                name="hscGroup"
                value={formData.hscGroup}
                type="select"
                options={["Science", "Business Studies", "Humanities"]}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="SSC Result"
                name="hscResult"
                value={formData.hscResult}
                placeholder="e.g., GPA 5.00"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Graduation Subject"
                name="graduationSubject"
                value={formData.graduationSubject}
                placeholder="Enter graduation subject"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Educational Institution"
                name="educationalInstitution"
                value={formData.educationalInstitution}
                placeholder="Name of your institution"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Current Study Year"
                name="currentStudyYear"
                value={formData.currentStudyYear}
                placeholder="e.g., 3rd Year"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Other Qualifications"
                name="otherEducationalQualifications"
                value={formData.otherEducationalQualifications}
                type="textarea"
                rows={3}
                placeholder="Enter other educational qualifications"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Profession"
                name="profession"
                value={formData.profession}
                placeholder="Enter your profession"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Monthly Income"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                type="select"
                options={DROPDOWN_OPTIONS.monthlyIncome}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Profession Description"
                name="professionDescription"
                value={formData.professionDescription}
                type="textarea"
                rows={3}
                placeholder="Describe your profession"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
            </div>
          </div>

          {/* Lifestyle & Health Section */}
          <div
            id="lifestyle-health"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={Activity} title="Lifestyle & Health" />
            <div className="space-y-0">
              <EditableField
                label="Religion"
                name="religion"
                value={formData.religion}
                type="select"
                options={DROPDOWN_OPTIONS.religion}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Religious Practices"
                name="religiousPractices"
                value={formData.religiousPractices}
                type="textarea"
                rows={3}
                placeholder="Describe your religious practices"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Practice Frequency"
                name="practiceFrequency"
                value={formData.practiceFrequency}
                type="select"
                options={DROPDOWN_OPTIONS.practiceFrequency}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Physical Illness"
                name="mentalPhysicalIllness"
                value={formData.mentalPhysicalIllness}
                type="textarea"
                rows={3}
                placeholder="Any mental or physical health information"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Hobbies & Interests"
                name="hobbiesLikesDislikesDreams"
                value={formData.hobbiesLikesDislikesDreams}
                type="textarea"
                rows={3}
                placeholder="Describe your hobbies, likes, dislikes, and dreams"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              {/* Partner preference fields - Show only for females */}
              {formData.gender === "Female" && (
                <>
                  <EditableField
                    label="Partner Study After Marriage"
                    name="partnerStudyAfterMarriage"
                    value={formData.partnerStudyAfterMarriage}
                    type="select"
                    options={[
                      "Strongly Support",
                      "Support",
                      "Neutral",
                      "Don't Support",
                      "Strongly Against",
                    ]}
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                  <EditableField
                    label="Partner Job After Marriage"
                    name="partnerJobAfterMarriage"
                    value={formData.partnerJobAfterMarriage}
                    type="select"
                    options={[
                      "Strongly Support",
                      "Support",
                      "Neutral",
                      "Don't Support",
                      "Strongly Against",
                    ]}
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                  <EditableField
                    label="Preferred Living Location"
                    name="preferredLivingLocation"
                    value={formData.preferredLivingLocation}
                    placeholder="Where would you like to live after marriage?"
                    handleChange={handleChange}
                    validationErrors={validationErrors}
                  />
                </>
              )}
            </div>
          </div>

          {/* Partner Preferences Section */}
          <div
            id="partner-preferences"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={Heart} title="Partner Preferences" />
            <div className="space-y-0">
              <EditableField
                label="Preferred Age Min"
                name="partnerAgePreferenceMin"
                value={formData.partnerAgePreferenceMin}
                type="select"
                options={Array.from({ length: 31 }, (_, i) => `${i + 18}`)}
                placeholder="Select minimum age"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Age Max"
                name="partnerAgePreferenceMax"
                value={formData.partnerAgePreferenceMax}
                type="select"
                options={Array.from({ length: 31 }, (_, i) => `${i + 18}`)}
                placeholder="Select maximum age"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Height Min"
                name="partnerHeightMin"
                value={formData.partnerHeightMin}
                type="select"
                options={DROPDOWN_OPTIONS.height}
                placeholder="Minimum height"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Height Max"
                name="partnerHeightMax"
                value={formData.partnerHeightMax}
                type="select"
                options={DROPDOWN_OPTIONS.height}
                placeholder="Maximum height"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Skin Tone"
                name="partnerSkinTone"
                value={formData.partnerSkinTone}
                type="select"
                options={["Any", "Fair", "Medium", "Dark"]}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Marital Status"
                name="partnerMaritalStatus"
                value={formData.partnerMaritalStatus}
                type="select"
                options={[...DROPDOWN_OPTIONS.partnerMaritalStatus, "Any"]}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Preferred Education"
                name="partnerEducation"
                value={formData.partnerEducation}
                placeholder="Minimum education requirement"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />

              <EditableField
                label="Preferred Profession"
                name="partnerProfession"
                value={formData.partnerProfession}
                handleChange={handleChange}
                validationErrors={validationErrors}
                placeholder="Preferred profession"
              />

              <EditableField
                label="Preferred Economic Condition"
                name="partnerEconomicCondition"
                value={formData.partnerEconomicCondition}
                type="select"
                options={[...DROPDOWN_OPTIONS.familyEconomicCondition, "Any"]}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <LocationDropdown
                label="Preferred District/Region"
                name="partnerDistrictRegion"
                value={formData.partnerDistrictRegion}
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
              <EditableField
                label="Specific Characteristics"
                name="specificCharacteristics"
                value={formData.specificCharacteristics}
                type="textarea"
                rows={3}
                placeholder="Any specific characteristics you're looking for"
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
            </div>
          </div>

          {/* Declaration Section */}
          <div
            id="declaration"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={Shield} title="Declaration" />
            <div className="bg-yellow-50 border-4 border-black rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Declaration fields cannot be modified after biodata creation and
                are displayed for reference only.
              </p>
            </div>
            <div className="space-y-0">
              <ReadOnlyField
                label="Guardian Knowledge"
                value={formData.guardianKnowledge}
              />
              <ReadOnlyField
                label="Information Truthfulness"
                value={formData.informationTruthfulness}
              />
              <ReadOnlyField
                label="False Information Agreement"
                value={formData.falseInformationAgreement}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div
            id="contact-info"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <SectionHeader icon={Contact} title="Contact Information" />
            <div className="space-y-0">
              <EditableField
                label="Contact Information"
                name="contactInformation"
                value={formData.contactInformation}
                type="textarea"
                rows={4}
                placeholder="Enter your contact details (phone, email, social media, etc.)"
                required={true}
                handleChange={handleChange}
                validationErrors={validationErrors}
              />
            </div>
          </div>

          {/* Save Button - Fixed at bottom */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors cursor-pointer text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
