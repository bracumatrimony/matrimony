import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Shield,
  Check,
  X,
  User,
  UserCheck,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import profileService from "../../services/profileService";
import authService from "../../services/authService";
import draftService from "../../services/draftService";
import {
  validateStep,
  getStepName,
  validateProfileData,
} from "../../utils/profileValidation";
import { PageSpinner, ButtonSpinner } from "../../components/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";
import {
  locationsByDivision,
  divisions,
  districtsByDivision,
} from "../../utils/locationData";

export default function BiodataCreate() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [componentLoading, setComponentLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Segment 1: Family Background
    fatherAlive: "",
    fatherOccupation: "",
    motherAlive: "",
    motherOccupation: "",
    brothersCount: "",
    brother1Occupation: "",
    brother2Occupation: "",
    brother3Occupation: "",
    sistersCount: "",
    sister1Occupation: "",
    sister2Occupation: "",
    sister3Occupation: "",
    unclesCount: "",
    uncle1Occupation: "",
    uncle2Occupation: "",
    uncle3Occupation: "",
    familyEconomicCondition: "",

    // Segment 2: Education & Profession
    educationMedium: "",
    hscPassingYear: "",
    hscGroup: "",
    hscResult: "",
    intermediatePassingYear: "",
    intermediateGroup: "",
    intermediateResult: "",
    graduationSubject: "",
    educationalInstitution: "",
    currentStudyYear: "",
    otherEducationalQualifications: "",
    profession: "",
    professionDescription: "",
    monthlyIncome: "",

    // Segment 3: Lifestyle, Health & Compatibility
    age: "",
    height: "",
    weight: "",
    skinTone: "",
    maritalStatus: "",
    presentAddressDivision: "",
    presentAddressDistrict: "",
    permanentAddressDivision: "",
    permanentAddressDistrict: "",
    religiousPractices: "",
    practiceFrequency: "",
    mentalPhysicalIllness: "",
    hobbiesLikesDislikesDreams: "",
    partnerStudyAfterMarriage: "",
    partnerJobAfterMarriage: "",
    preferredLivingLocation: "",

    // Segment 4: Expected Life Partner & Declaration
    partnerAgePreferenceMin: "",
    partnerAgePreferenceMax: "",
    partnerSkinTone: "",
    partnerHeightMin: "",
    partnerHeightMax: "",
    partnerEducation: "",
    partnerDistrictRegion: "",
    partnerMaritalStatus: "",
    partnerProfession: "",
    partnerEconomicCondition: "",
    specificCharacteristics: "",
    guardianKnowledge: "",
    informationTruthfulness: "",
    falseInformationAgreement: "",

    // Contact Information
    contactInformation: "",

    // Gender (added for modal selection)
    gender: "",
    religion: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const [notification, setNotification] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();

  const totalSteps = 4;

  useEffect(() => {
    const loadDraftData = async () => {
      try {
        setComponentLoading(true);

        // Wait for auth loading to complete
        if (authLoading) {
          return;
        }

        if (!user) {
          navigate("/login");
          return;
        }

        // Check if user wants to start fresh
        const startFresh = searchParams.get("new") === "true";

        if (startFresh) {
          // Clear any existing drafts and start with empty form
          try {
            await draftService.deleteDraft();
          } catch (error) {
            console.log("No draft to delete or error deleting draft:", error);
          }
          localStorage.removeItem("createProfile_formData");
          localStorage.removeItem("createProfile_currentStep");
          setComponentLoading(false);
          return;
        }

        try {
          // Load saved draft from server
          const response = await draftService.getDraft();

          if (response.success && response.draft) {
            setFormData(response.draft.draftData);
            setCurrentStep(response.draft.currentStep);
          }
        } catch (error) {
          console.error("Error loading draft from server:", error);
          // Fallback to localStorage if server fails
          const savedFormData = localStorage.getItem("createProfile_formData");
          const savedStep = localStorage.getItem("createProfile_currentStep");

          if (savedFormData) {
            try {
              const parsedData = JSON.parse(savedFormData);
              setFormData(parsedData);
            } catch (parseError) {
              console.error("Error parsing saved form data:", parseError);
            }
          }

          if (savedStep) {
            const parsedStep = parseInt(savedStep);
            if (parsedStep >= 1 && parsedStep <= totalSteps) {
              setCurrentStep(parsedStep);
            }
          }
        }
      } finally {
        setComponentLoading(false);
      }
    };

    loadDraftData();
  }, [authLoading, user, navigate, searchParams, totalSteps]);

  useEffect(() => {
    // Save progress when user navigates away or closes browser
    const handleBeforeUnload = async (event) => {
      // Final save to both server and localStorage before leaving
      try {
        await draftService.saveDraft(currentStep, formData);
      } catch (error) {
        // Fallback to localStorage if server fails
        localStorage.setItem(
          "createProfile_formData",
          JSON.stringify(formData)
        );
        localStorage.setItem(
          "createProfile_currentStep",
          currentStep.toString()
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup event listener
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentStep, formData]);

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(updatedFormData);

    // Auto-save to server with debouncing (saves after 2 seconds of no changes)
    draftService.saveDraftDebounced(currentStep, updatedFormData);

    // Also save to localStorage as backup
    localStorage.setItem(
      "createProfile_formData",
      JSON.stringify(updatedFormData)
    );

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateCurrentStep = (step) => {
    const stepErrors = validateStep(step, formData);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      // Show toast notification for the first error
      const firstError = Object.values(stepErrors)[0];
      const stepName = getStepName(step);
      showNotification(`${stepName}: ${firstError}`, "error");
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (validateCurrentStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(nextStep);

      try {
        // Save to server when moving to next step
        await draftService.saveDraft(nextStep, formData);
      } catch (error) {
        console.error("Error saving draft on next step:", error);
      }

      // Save current step to localStorage as backup
      localStorage.setItem("createProfile_currentStep", nextStep.toString());
    }
  };

  const handlePrevious = async () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);

    try {
      // Save to server when moving to previous step
      await draftService.saveDraft(prevStep, formData);
    } catch (error) {
      console.error("Error saving draft on previous step:", error);
    }

    // Save current step to localStorage as backup
    localStorage.setItem("createProfile_currentStep", prevStep.toString());
  };

  const handleCreateBiodataClick = async () => {
    // Validate all steps before allowing submission
    let allStepsValid = true;
    const allErrors = {};

    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step, formData);
      if (Object.keys(stepErrors).length > 0) {
        allStepsValid = false;
        Object.assign(allErrors, stepErrors);
      }
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      // Scroll to the first error to help user see what's missing
      setTimeout(() => {
        const firstErrorElement = document.querySelector(".text-red-600");
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
      return;
    }

    // Check if gender is selected
    if (!formData.gender) {
      setErrors({ gender: "Please select your gender" });
      // Scroll to gender field
      setTimeout(() => {
        const genderField = document.querySelector('select[name="gender"]');
        if (genderField) {
          genderField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
      return;
    }

    // Directly submit with selected gender
    handleSubmit(formData.gender);
  };

  const handleSubmit = async (selectedGender) => {
    setIsLoading(true);

    // Validate the complete form data before submission
    // Prepare the form data with combined fields for validation
    const completeFormData = {
      ...formData,
      gender: selectedGender || formData.gender,
      // Combine age preference fields for validation
      partnerAgePreference:
        formData.partnerAgePreferenceMin && formData.partnerAgePreferenceMax
          ? `${formData.partnerAgePreferenceMin} - ${formData.partnerAgePreferenceMax} years`
          : "",
      // Combine height preference fields for validation
      partnerHeight:
        formData.partnerHeightMin && formData.partnerHeightMax
          ? `${formData.partnerHeightMin} - ${formData.partnerHeightMax} feet`
          : "",
    };
    const validationErrors = validateProfileData(completeFormData);

    if (Object.keys(validationErrors).length > 0) {
      console.error("Form validation errors:", validationErrors);
      setErrors(validationErrors);

      // Show toast notification for the first validation error
      const firstError = Object.values(validationErrors)[0];
      showNotification(`Please fix the following: ${firstError}`, "error");

      setIsLoading(false);
      return;
    }

    try {
      // Prepare profile data
      // Prepare dynamic sibling occupation data
      const dynamicSiblingData = {};

      // Add brother occupations dynamically
      const brothersCount = parseInt(formData.brothersCount) || 0;
      for (let i = 1; i <= brothersCount; i++) {
        const fieldName = `brother${i}Occupation`;
        dynamicSiblingData[fieldName] = formData[fieldName]?.trim() || "";
      }

      // Add sister occupations dynamically
      const sistersCount = parseInt(formData.sistersCount) || 0;
      for (let i = 1; i <= sistersCount; i++) {
        const fieldName = `sister${i}Occupation`;
        dynamicSiblingData[fieldName] = formData[fieldName]?.trim() || "";
      }

      // Add uncle occupations dynamically
      const unclesCount = parseInt(formData.unclesCount) || 0;
      for (let i = 1; i <= unclesCount; i++) {
        const fieldName = `uncle${i}Occupation`;
        dynamicSiblingData[fieldName] = formData[fieldName]?.trim() || "";
      }

      const profileData = {
        // Family Background
        fatherAlive: formData.fatherAlive,
        fatherOccupation: formData.fatherOccupation?.trim() || "",
        motherAlive: formData.motherAlive,
        motherOccupation: formData.motherOccupation?.trim() || "",
        brothersCount: brothersCount,
        sistersCount: sistersCount,
        unclesCount: unclesCount,
        ...dynamicSiblingData, // Include all dynamic sibling occupation data
        familyEconomicCondition: formData.familyEconomicCondition,

        // Education & Profession
        educationMedium: formData.educationMedium,
        hscPassingYear: formData.hscPassingYear,
        hscGroup: formData.hscGroup?.trim() || "",
        hscResult: formData.hscResult?.trim() || "",
        intermediatePassingYear: formData.intermediatePassingYear,
        intermediateGroup: formData.intermediateGroup?.trim() || "",
        intermediateResult: formData.intermediateResult?.trim() || "",
        graduationSubject: formData.graduationSubject?.trim() || "",
        educationalInstitution: formData.educationalInstitution?.trim() || "",
        currentStudyYear: formData.currentStudyYear?.trim() || "",
        otherEducationalQualifications:
          formData.otherEducationalQualifications?.trim() || "",
        profession: formData.profession?.trim() || "",
        professionDescription: formData.professionDescription?.trim() || "",
        monthlyIncome: formData.monthlyIncome,

        // Lifestyle, Health & Compatibility
        age: formData.age || "",
        height: formData.height || "",
        weight: formData.weight || "",
        skinTone: formData.skinTone || "",
        maritalStatus: formData.maritalStatus || "",
        presentAddressDivision: formData.presentAddressDivision?.trim() || "",
        presentAddressDistrict: formData.presentAddressDistrict?.trim() || "",
        permanentAddressDivision:
          formData.permanentAddressDivision?.trim() || "",
        permanentAddressDistrict:
          formData.permanentAddressDistrict?.trim() || "",
        religiousPractices: formData.religiousPractices?.trim() || "",
        practiceFrequency: formData.practiceFrequency?.trim() || "",
        mentalPhysicalIllness: formData.mentalPhysicalIllness?.trim() || "",
        hobbiesLikesDislikesDreams:
          formData.hobbiesLikesDislikesDreams?.trim() || "",
        partnerStudyAfterMarriage: formData.partnerStudyAfterMarriage || "",
        partnerJobAfterMarriage: formData.partnerJobAfterMarriage || "",
        preferredLivingLocation: formData.preferredLivingLocation?.trim() || "",

        // Expected Life Partner & Declaration
        partnerAgePreference:
          formData.partnerAgePreferenceMin && formData.partnerAgePreferenceMax
            ? `${formData.partnerAgePreferenceMin} - ${formData.partnerAgePreferenceMax} years`
            : "",
        partnerSkinTone: formData.partnerSkinTone,
        partnerHeight:
          formData.partnerHeightMin && formData.partnerHeightMax
            ? `${formData.partnerHeightMin} - ${formData.partnerHeightMax} feet`
            : "",
        partnerEducation: formData.partnerEducation?.trim() || "",
        partnerDistrictRegion: formData.partnerDistrictRegion?.trim() || "",
        partnerMaritalStatus: formData.partnerMaritalStatus,
        partnerProfession: formData.partnerProfession?.trim() || "",
        partnerEconomicCondition: formData.partnerEconomicCondition,
        specificCharacteristics: formData.specificCharacteristics?.trim() || "",
        guardianKnowledge: formData.guardianKnowledge,
        informationTruthfulness: formData.informationTruthfulness,
        falseInformationAgreement: formData.falseInformationAgreement,

        // Contact Information
        contactInformation: formData.contactInformation?.trim() || "",

        // Gender - use the selectedGender parameter to avoid state timing issues
        gender: selectedGender || formData.gender || "",
        religion: formData.religion || "",
      };

      const response = await profileService.createProfile(profileData);

      if (response.success) {
        // Refresh user data from server to get updated hasProfile status
        await refreshUser();

        // Small delay to ensure database consistency
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Clear saved form data from both server and localStorage since profile was successfully created
        await draftService.deleteDraft();
        localStorage.removeItem("createProfile_formData");
        localStorage.removeItem("createProfile_currentStep");

        // Show success animation before navigating
        setIsLoading(false);
        setShowSuccessAnimation(true);

        // Navigate after animation completes
        setTimeout(() => {
          setAnimationComplete(true);
          setTimeout(() => {
            navigate("/profile");
          }, 500);
        }, 3000);
      } else {
        throw new Error(response.message || "Failed to create profile");
      }
    } catch (error) {
      console.error("Profile creation error:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);

      // Handle backend validation errors
      if (error.response?.data?.errors) {
        console.log(
          "Setting field-specific errors:",
          error.response.data.errors
        );
        setErrors(error.response.data.errors);

        // Show toast for the first backend validation error
        const firstError = Object.values(error.response.data.errors)[0];
        showNotification(`${firstError}`, "error");
      } else if (error.response?.data?.details) {
        console.log("Setting detail errors:", error.response.data.details);
        const backendErrors = {};
        error.response.data.details.forEach((detail, index) => {
          backendErrors[`error_${index}`] = detail;
        });
        setErrors(backendErrors);

        // Show toast for the first detail error
        const firstDetail = error.response.data.details[0];
        showNotification(`Error: ${firstDetail}`, "error");
      } else {
        console.log("Setting general error:", error.message);
        const generalError =
          error.message || "Failed to create profile. Please try again.";
        setErrors({
          general: generalError,
        });

        showNotification(generalError, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Family Background
              </h3>
              <p className="text-gray-600">
                Tell us about your family to help us find the perfect match
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Father Status */}
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  Is your father alive? *
                </label>
                <div className="relative">
                  <select
                    name="fatherAlive"
                    value={formData.fatherAlive}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                      errors.fatherAlive
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-gray-300 focus:border-rose-500 focus:ring-rose-200"
                    } focus:outline-none focus:ring-4 text-gray-900 placeholder-gray-500`}
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {errors.fatherAlive && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {errors.fatherAlive}
                  </motion.p>
                )}
              </div>

              {formData.fatherAlive === "Yes" && (
                <div className="md:col-span-2">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    Father's Occupation Details *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.fatherOccupation
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 hover:border-gray-300 focus:border-rose-500 focus:ring-rose-200"
                      } focus:outline-none focus:ring-4 text-gray-900 placeholder-gray-500`}
                      placeholder="e.g., Government Officer, Business Owner, Engineer, Retired, etc."
                    />
                  </div>
                  {errors.fatherOccupation && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {errors.fatherOccupation}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Mother Status */}
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  Is your mother alive? *
                </label>
                <div className="relative">
                  <select
                    name="motherAlive"
                    value={formData.motherAlive}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                      errors.motherAlive
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-gray-300 focus:border-rose-500 focus:ring-rose-200"
                    } focus:outline-none focus:ring-4 text-gray-900 placeholder-gray-500`}
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {errors.motherAlive && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {errors.motherAlive}
                  </motion.p>
                )}
              </div>

              {/* Mother's Occupation */}
              {formData.motherAlive === "Yes" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Occupation Details *
                  </label>
                  <input
                    type="text"
                    name="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.motherOccupation
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                    placeholder="e.g., Housewife, Teacher, Doctor, Government Officer, etc."
                  />
                  {errors.motherOccupation && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.motherOccupation}
                    </p>
                  )}
                </div>
              )}

              {/* Brothers Count */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  How many brothers do you have? *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="brothersCount"
                    value={formData.brothersCount}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                      errors.brothersCount
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-gray-300 focus:border-rose-500 focus:ring-rose-200"
                    } focus:outline-none focus:ring-4 text-gray-900 placeholder-gray-500`}
                  />
                </div>
                {errors.brothersCount && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {errors.brothersCount}
                  </motion.p>
                )}
              </div>

              {/* Sisters Count */}
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  How many sisters do you have? *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="sistersCount"
                    value={formData.sistersCount}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                      errors.sistersCount
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-gray-300 focus:border-rose-500 focus:ring-rose-200"
                    } focus:outline-none focus:ring-4 text-gray-900 placeholder-gray-500`}
                  />
                </div>
                {errors.sistersCount && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {errors.sistersCount}
                  </motion.p>
                )}
              </div>

              {/* Brothers Occupations */}
              {Array.from(
                { length: parseInt(formData.brothersCount) || 0 },
                (_, index) => (
                  <div key={`brother-${index + 1}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brother {index + 1}: Describe your brother's occupation
                    </label>
                    <input
                      type="text"
                      name={`brother${index + 1}Occupation`}
                      value={formData[`brother${index + 1}Occupation`] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                      placeholder="e.g., Software Engineer, Teacher, Business Owner, Student, etc."
                    />
                  </div>
                )
              )}

              {/* Sisters Occupations */}
              {Array.from(
                { length: parseInt(formData.sistersCount) || 0 },
                (_, index) => (
                  <div key={`sister-${index + 1}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sister {index + 1}: Describe your sister's occupation
                    </label>
                    <input
                      type="text"
                      name={`sister${index + 1}Occupation`}
                      value={formData[`sister${index + 1}Occupation`] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                      placeholder="e.g., Housewife, Doctor, Teacher, Engineer, Student, etc."
                    />
                  </div>
                )
              )}

              {/* Uncles Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many uncles do you have?
                </label>
                <input
                  type="number"
                  name="unclesCount"
                  value={formData.unclesCount}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* Uncles Occupations */}
              {Array.from(
                { length: parseInt(formData.unclesCount) || 0 },
                (_, index) => (
                  <div key={`uncle-${index + 1}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Uncle {index + 1}: Describe your uncle's occupation
                    </label>
                    <input
                      type="text"
                      name={`uncle${index + 1}Occupation`}
                      value={formData[`uncle${index + 1}Occupation`] || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                      placeholder="e.g., Business Owner, Government Employee, Farmer, Retired, etc."
                    />
                  </div>
                )
              )}

              {/* Family Economic Condition */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your family's economic condition? *
                </label>
                <select
                  name="familyEconomicCondition"
                  value={formData.familyEconomicCondition}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.familyEconomicCondition
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Economic Condition</option>
                  <option value="Lower">Lower</option>
                  <option value="Middle">Middle</option>
                  <option value="Upper-middle">Upper-middle</option>
                  <option value="Affluent">Affluent</option>
                </select>
                {errors.familyEconomicCondition && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.familyEconomicCondition}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Education & Profession
              </h3>
              <p className="text-gray-600">
                Share your educational background and professional details
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Educational Qualifications */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Educational Qualifications
                </h4>
              </div>

              {/* Education Medium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What was the medium of your education? *
                </label>
                <select
                  name="educationMedium"
                  value={formData.educationMedium}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.educationMedium
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Medium</option>
                  <option value="Bengali">Bengali</option>
                  <option value="English">English</option>
                  <option value="Both">Both</option>
                </select>
                {errors.educationMedium && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.educationMedium}
                  </p>
                )}
              </div>

              {/* HSC Passing Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of passing HSC/equivalent: *
                </label>
                <input
                  type="number"
                  name="intermediatePassingYear"
                  value={formData.intermediatePassingYear}
                  onChange={handleChange}
                  min="1990"
                  max="2030"
                  className={`w-full px-3 py-2 border ${
                    errors.intermediatePassingYear
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., 2019"
                />
                {errors.intermediatePassingYear && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.intermediatePassingYear}
                  </p>
                )}
              </div>

              {/* HSC Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group/Department of HSC: *
                </label>
                <input
                  type="text"
                  name="intermediateGroup"
                  value={formData.intermediateGroup}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.intermediateGroup
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., Science, Commerce, Arts"
                />
                {errors.intermediateGroup && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.intermediateGroup}
                  </p>
                )}
              </div>

              {/* HSC Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result/grade of HSC: *
                </label>
                <input
                  type="text"
                  name="intermediateResult"
                  value={formData.intermediateResult}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.intermediateResult
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., GPA 5.00, A+, First Division"
                />
                {errors.intermediateResult && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.intermediateResult}
                  </p>
                )}
              </div>

              {/* Intermediate Passing Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of passing SSC/equivalent:
                </label>
                <input
                  type="number"
                  name="hscPassingYear"
                  value={formData.hscPassingYear}
                  onChange={handleChange}
                  min="1990"
                  max="2035"
                  className={`w-full px-3 py-2 border ${
                    errors.hscPassingYear ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., 2017"
                />
                {errors.hscPassingYear && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hscPassingYear}
                  </p>
                )}
              </div>

              {/* Intermediate Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group/Department of SSC:
                </label>
                <input
                  type="text"
                  name="hscGroup"
                  value={formData.hscGroup}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.hscGroup ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., Science, Commerce, Arts"
                />
                {errors.hscGroup && (
                  <p className="mt-1 text-sm text-red-600">{errors.hscGroup}</p>
                )}
              </div>

              {/* Intermediate Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result/grade of SSC:
                </label>
                <input
                  type="text"
                  name="hscResult"
                  value={formData.hscResult}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.hscResult ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., GPA 4.50, A, Second Division"
                />
                {errors.hscResult && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hscResult}
                  </p>
                )}
              </div>

              {/* Graduation Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject of graduation/honors/equivalent studies:
                </label>
                <input
                  type="text"
                  name="graduationSubject"
                  value={formData.graduationSubject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                  placeholder="e.g., Computer Science, Economics, Physics"
                />
              </div>

              {/* Educational Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional degrees or certifications:
                </label>
                <input
                  type="text"
                  name="educationalInstitution"
                  value={formData.educationalInstitution}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                  placeholder="e.g., minors, online courses"
                />
              </div>

              {/* Current Study Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current year of study (if applicable):
                </label>
                <input
                  type="text"
                  name="currentStudyYear"
                  value={formData.currentStudyYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                  placeholder="e.g., 2nd Year, Final Year, Completed"
                />
              </div>

              {/* Professional Information */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Professional Information
                </h4>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your profession? *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.profession ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., Software Engineer, Student, Doctor"
                />
                {errors.profession && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.profession}
                  </p>
                )}
              </div>

              {/* Monthly Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your monthly income? *
                </label>
                <select
                  name="monthlyIncome"
                  value={formData.monthlyIncome}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.monthlyIncome ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Income Range</option>
                  <option value="No Income">No Income</option>
                  <option value="Below 20,000 BDT">Below 20,000 BDT</option>
                  <option value="20,000 - 40,000 BDT">
                    20,000 - 40,000 BDT
                  </option>
                  <option value="40,000 - 60,000 BDT">
                    40,000 - 60,000 BDT
                  </option>
                  <option value="60,000 - 80,000 BDT">
                    60,000 - 80,000 BDT
                  </option>
                  <option value="80,000 - 100,000 BDT">
                    80,000 - 100,000 BDT
                  </option>
                  <option value="Above 100,000 BDT">Above 100,000 BDT</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.monthlyIncome && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.monthlyIncome}
                  </p>
                )}
              </div>

              {/* Profession Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide a detailed description of your profession: *
                </label>
                <textarea
                  name="professionDescription"
                  value={formData.professionDescription}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border ${
                    errors.professionDescription
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="Please describe your profession, responsibilities, workplace, etc."
                />
                {errors.professionDescription && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.professionDescription}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Lifestyle & Compatibility
              </h3>
              <p className="text-gray-600">
                Share your lifestyle preferences and personal details
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Personal Information
                </h4>
              </div>

              {/* Gender, Religion and Age - First Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender: *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.gender ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Religion: *
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.religion ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Religion</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Christian">Christian</option>
                    <option value="Buddhist">Buddhist</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.religion && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.religion}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age: *
                  </label>
                  <select
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.age ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Age</option>
                    {Array.from({ length: 43 }, (_, i) => i + 18).map((age) => (
                      <option key={age} value={age}>
                        {age} years
                      </option>
                    ))}
                  </select>
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>
              </div>

              {/* Height and Weight - Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height: *
                  </label>
                  <select
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.height ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Height</option>
                    <option value="4'6&quot;">4'6"</option>
                    <option value="4'7&quot;">4'7"</option>
                    <option value="4'8&quot;">4'8"</option>
                    <option value="4'9&quot;">4'9"</option>
                    <option value="4'10&quot;">4'10"</option>
                    <option value="4'11&quot;">4'11"</option>
                    <option value="5'0&quot;">5'0"</option>
                    <option value="5'1&quot;">5'1"</option>
                    <option value="5'2&quot;">5'2"</option>
                    <option value="5'3&quot;">5'3"</option>
                    <option value="5'4&quot;">5'4"</option>
                    <option value="5'5&quot;">5'5"</option>
                    <option value="5'6&quot;">5'6"</option>
                    <option value="5'7&quot;">5'7"</option>
                    <option value="5'8&quot;">5'8"</option>
                    <option value="5'9&quot;">5'9"</option>
                    <option value="5'10&quot;">5'10"</option>
                    <option value="5'11&quot;">5'11"</option>
                    <option value="6'0&quot;">6'0"</option>
                    <option value="6'1&quot;">6'1"</option>
                    <option value="6'2&quot;">6'2"</option>
                    <option value="6'3&quot;">6'3"</option>
                    <option value="6'4&quot;">6'4"</option>
                  </select>
                  {errors.height && (
                    <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight: *
                  </label>
                  <select
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.weight ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Weight</option>
                    {Array.from({ length: 101 }, (_, i) => i + 40).map(
                      (weight) => (
                        <option key={weight} value={`${weight} kg`}>
                          {weight} kg
                        </option>
                      )
                    )}
                  </select>
                  {errors.weight && (
                    <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                  )}
                </div>
              </div>

              {/* Skin Tone and Marital Status - Third Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skin Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skin Tone: *
                  </label>
                  <select
                    name="skinTone"
                    value={formData.skinTone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.skinTone ? "border-red-300" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Skin Tone</option>
                    <option value="Fair">Fair</option>
                    <option value="Medium">Medium</option>
                    <option value="Dark">Dark</option>
                    <option value="Very Fair">Very Fair</option>
                    <option value="Wheatish">Wheatish</option>
                  </select>
                  {errors.skinTone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.skinTone}
                    </p>
                  )}
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marital Status: *
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errors.maritalStatus
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    <option value="">Select Status</option>
                    <option value="Never Married">Never Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {errors.maritalStatus && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maritalStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Address Information
                </h4>
              </div>

              {/* Present Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Present Address - Division: *
                  </label>
                  <select
                    name="presentAddressDivision"
                    value={formData.presentAddressDivision}
                    onChange={(e) => {
                      handleChange(e);
                      // Reset district when division changes
                      setFormData((prev) => ({
                        ...prev,
                        presentAddressDistrict: "",
                      }));
                    }}
                    className={`w-full px-3 py-2 border ${
                      errors.presentAddressDivision
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    {divisions.map((division) => (
                      <option key={division.value} value={division.value}>
                        {division.label}
                      </option>
                    ))}
                  </select>
                  {errors.presentAddressDivision && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.presentAddressDivision}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Present Address - District: *
                  </label>
                  <select
                    name="presentAddressDistrict"
                    value={formData.presentAddressDistrict}
                    onChange={handleChange}
                    disabled={!formData.presentAddressDivision}
                    className={`w-full px-3 py-2 border ${
                      errors.presentAddressDistrict
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 ${
                      !formData.presentAddressDivision
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {(
                      districtsByDivision[formData.presentAddressDivision] || [
                        { value: "", label: "Select Division First" },
                      ]
                    ).map((district) => (
                      <option key={district.value} value={district.value}>
                        {district.label}
                      </option>
                    ))}
                  </select>
                  {errors.presentAddressDistrict && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.presentAddressDistrict}
                    </p>
                  )}
                </div>
              </div>

              {/* Permanent Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permanent Address - Division: *
                  </label>
                  <select
                    name="permanentAddressDivision"
                    value={formData.permanentAddressDivision}
                    onChange={(e) => {
                      handleChange(e);
                      // Reset district when division changes
                      setFormData((prev) => ({
                        ...prev,
                        permanentAddressDistrict: "",
                      }));
                    }}
                    className={`w-full px-3 py-2 border ${
                      errors.permanentAddressDivision
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  >
                    {divisions.map((division) => (
                      <option key={division.value} value={division.value}>
                        {division.label}
                      </option>
                    ))}
                  </select>
                  {errors.permanentAddressDivision && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.permanentAddressDivision}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permanent Address - District: *
                  </label>
                  <select
                    name="permanentAddressDistrict"
                    value={formData.permanentAddressDistrict}
                    onChange={handleChange}
                    disabled={!formData.permanentAddressDivision}
                    className={`w-full px-3 py-2 border ${
                      errors.permanentAddressDistrict
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 ${
                      !formData.permanentAddressDivision
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {(
                      districtsByDivision[
                        formData.permanentAddressDivision
                      ] || [{ value: "", label: "Select Division First" }]
                    ).map((district) => (
                      <option key={district.value} value={district.value}>
                        {district.label}
                      </option>
                    ))}
                  </select>
                  {errors.permanentAddressDistrict && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.permanentAddressDistrict}
                    </p>
                  )}
                </div>
              </div>

              {/* Religious Practices */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are your regular spiritual or religious practices? *
                </label>
                <textarea
                  name="religiousPractices"
                  value={formData.religiousPractices}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border ${
                    errors.religiousPractices
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="Please describe your religious or spiritual practices"
                />
                {errors.religiousPractices && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.religiousPractices}
                  </p>
                )}
              </div>

              {/* Practice Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How often do you practice your beliefs? *
                </label>
                <select
                  name="practiceFrequency"
                  value={formData.practiceFrequency}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.practiceFrequency
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Rarely">Rarely</option>
                </select>
                {errors.practiceFrequency && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.practiceFrequency}
                  </p>
                )}
              </div>

              {/* Mental/Physical Illness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have any mental or physical illness? Please specify. *
                </label>
                <textarea
                  name="mentalPhysicalIllness"
                  value={formData.mentalPhysicalIllness}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border ${
                    errors.mentalPhysicalIllness
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="Please mention any health conditions, or write 'None' if you have no health issues"
                />
                {errors.mentalPhysicalIllness && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.mentalPhysicalIllness}
                  </p>
                )}
              </div>

              {/* Hobbies, Likes, Dislikes, Dreams */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe your hobbies, likes, dislikes, tastes, and
                  dreams: *
                </label>
                <textarea
                  name="hobbiesLikesDislikesDreams"
                  value={formData.hobbiesLikesDislikesDreams}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border ${
                    errors.hobbiesLikesDislikesDreams
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="Tell us about your interests, hobbies, what you like/dislike, and your dreams"
                />
                {errors.hobbiesLikesDislikesDreams && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hobbiesLikesDislikesDreams}
                  </p>
                )}
              </div>

              {/* Marriage Compatibility Views (Female only) */}
              {formData.gender === "Female" && (
                <>
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">
                      Marriage Compatibility Views
                    </h4>
                  </div>

                  {/* Partner Study After Marriage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What is your view on continuing your studies after
                      marriage?
                    </label>
                    <select
                      name="partnerStudyAfterMarriage"
                      value={formData.partnerStudyAfterMarriage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="">Select View</option>
                      <option value="Strongly Support">Strongly Support</option>
                      <option value="Support">Support</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Don't Support">Don't Support</option>
                      <option value="Strongly Against">Strongly Against</option>
                    </select>
                  </div>

                  {/* Partner Job After Marriage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What is your view on having a job after marriage?
                    </label>
                    <select
                      name="partnerJobAfterMarriage"
                      value={formData.partnerJobAfterMarriage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="">Select View</option>
                      <option value="Strongly Support">Strongly Support</option>
                      <option value="Support">Support</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Don't Support">Don't Support</option>
                      <option value="Strongly Against">Strongly Against</option>
                    </select>
                  </div>

                  {/* Preferred Living Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where would you prefer to live with your husband after
                      marriage?
                    </label>
                    <textarea
                      name="preferredLivingLocation"
                      value={formData.preferredLivingLocation}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                      placeholder="e.g., Own house, With parents, Separate apartment, Specific city/country"
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Partner Preferences
              </h3>
              <p className="text-gray-600">
                Describe your ideal life partner and complete your biodata
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Expected Life Partner */}
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Expected Life Partner
                </h4>
              </div>

              {/* Partner Age Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred age of partner: *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Minimum Age
                    </label>
                    <select
                      name="partnerAgePreferenceMin"
                      value={formData.partnerAgePreferenceMin}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.partnerAgePreferenceMin
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                    >
                      <option value="">Select Min Age</option>
                      {Array.from({ length: 31 }, (_, i) => i + 18).map(
                        (age) => (
                          <option key={age} value={age}>
                            {age} years
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Maximum Age
                    </label>
                    <select
                      name="partnerAgePreferenceMax"
                      value={formData.partnerAgePreferenceMax}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.partnerAgePreferenceMax
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                    >
                      <option value="">Select Max Age</option>
                      {Array.from({ length: 31 }, (_, i) => i + 18).map(
                        (age) => (
                          <option key={age} value={age}>
                            {age} years
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
                {(errors.partnerAgePreferenceMin ||
                  errors.partnerAgePreferenceMax) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerAgePreferenceMin ||
                      errors.partnerAgePreferenceMax}
                  </p>
                )}
              </div>

              {/* Partner Skin Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred skin tone: *
                </label>
                <select
                  name="partnerSkinTone"
                  value={formData.partnerSkinTone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerSkinTone
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Skin Tone</option>
                  <option value="Any">Any</option>
                  <option value="Fair">Fair</option>
                  <option value="Medium">Medium</option>
                  <option value="Dark">Dark</option>
                </select>
                {errors.partnerSkinTone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerSkinTone}
                  </p>
                )}
              </div>

              {/* Partner Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred height: *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Minimum Height
                    </label>
                    <select
                      name="partnerHeightMin"
                      value={formData.partnerHeightMin}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.partnerHeightMin
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                    >
                      <option value="">Select Min Height</option>
                      <option value="4'6&quot;">4'6"</option>
                      <option value="4'7&quot;">4'7"</option>
                      <option value="4'8&quot;">4'8"</option>
                      <option value="4'9&quot;">4'9"</option>
                      <option value="4'10&quot;">4'10"</option>
                      <option value="4'11&quot;">4'11"</option>
                      <option value="5'0&quot;">5'0"</option>
                      <option value="5'1&quot;">5'1"</option>
                      <option value="5'2&quot;">5'2"</option>
                      <option value="5'3&quot;">5'3"</option>
                      <option value="5'4&quot;">5'4"</option>
                      <option value="5'5&quot;">5'5"</option>
                      <option value="5'6&quot;">5'6"</option>
                      <option value="5'7&quot;">5'7"</option>
                      <option value="5'8&quot;">5'8"</option>
                      <option value="5'9&quot;">5'9"</option>
                      <option value="5'10&quot;">5'10"</option>
                      <option value="5'11&quot;">5'11"</option>
                      <option value="6'0&quot;">6'0"</option>
                      <option value="6'1&quot;">6'1"</option>
                      <option value="6'2&quot;">6'2"</option>
                      <option value="6'3&quot;">6'3"</option>
                      <option value="6'4&quot;">6'4"</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Maximum Height
                    </label>
                    <select
                      name="partnerHeightMax"
                      value={formData.partnerHeightMax}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border ${
                        errors.partnerHeightMax
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                    >
                      <option value="">Select Max Height</option>
                      <option value="4'6&quot;">4'6"</option>
                      <option value="4'7&quot;">4'7"</option>
                      <option value="4'8&quot;">4'8"</option>
                      <option value="4'9&quot;">4'9"</option>
                      <option value="4'10&quot;">4'10"</option>
                      <option value="4'11&quot;">4'11"</option>
                      <option value="5'0&quot;">5'0"</option>
                      <option value="5'1&quot;">5'1"</option>
                      <option value="5'2&quot;">5'2"</option>
                      <option value="5'3&quot;">5'3"</option>
                      <option value="5'4&quot;">5'4"</option>
                      <option value="5'5&quot;">5'5"</option>
                      <option value="5'6&quot;">5'6"</option>
                      <option value="5'7&quot;">5'7"</option>
                      <option value="5'8&quot;">5'8"</option>
                      <option value="5'9&quot;">5'9"</option>
                      <option value="5'10&quot;">5'10"</option>
                      <option value="5'11&quot;">5'11"</option>
                      <option value="6'0&quot;">6'0"</option>
                      <option value="6'1&quot;">6'1"</option>
                      <option value="6'2&quot;">6'2"</option>
                      <option value="6'3&quot;">6'3"</option>
                      <option value="6'4&quot;">6'4"</option>
                    </select>
                  </div>
                </div>
                {(errors.partnerHeightMin || errors.partnerHeightMax) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerHeightMin || errors.partnerHeightMax}
                  </p>
                )}
              </div>

              {/* Partner Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Educational qualification of partner: *
                </label>
                <select
                  name="partnerEducation"
                  value={formData.partnerEducation}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerEducation
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Education Level</option>
                  <option value="Higher Secondary/HSC">
                    Higher Secondary/HSC
                  </option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="PhD/Doctorate">PhD/Doctorate</option>
                  <option value="Professional Certification">
                    Professional Certification
                  </option>
                  <option value="Religious Education">
                    Religious Education
                  </option>
                  <option value="Any">Any</option>
                </select>
                {errors.partnerEducation && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerEducation}
                  </p>
                )}
              </div>

              {/* Partner District/Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred district/region: *
                </label>
                <select
                  name="partnerDistrictRegion"
                  value={formData.partnerDistrictRegion}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerDistrictRegion
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  {locationsByDivision[""].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {Object.entries(locationsByDivision).map(
                    ([division, locations]) => {
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
                    }
                  )}
                </select>
                {errors.partnerDistrictRegion && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerDistrictRegion}
                  </p>
                )}
              </div>

              {/* Partner Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred marital status: *
                </label>
                <select
                  name="partnerMaritalStatus"
                  value={formData.partnerMaritalStatus}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerMaritalStatus
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Any">Any</option>
                </select>
                {errors.partnerMaritalStatus && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerMaritalStatus}
                  </p>
                )}
              </div>

              {/* Partner Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred profession of partner: *
                </label>
                <input
                  type="text"
                  name="partnerProfession"
                  value={formData.partnerProfession}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerProfession
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                  placeholder="e.g., Any professional job, Doctor, Engineer"
                />
                {errors.partnerProfession && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerProfession}
                  </p>
                )}
              </div>

              {/* Partner Economic Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred economic condition of partner: *
                </label>
                <select
                  name="partnerEconomicCondition"
                  value={formData.partnerEconomicCondition}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.partnerEconomicCondition
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                >
                  <option value="">Select Economic Condition</option>
                  <option value="Lower">Lower</option>
                  <option value="Middle">Middle</option>
                  <option value="Upper-middle">Upper-middle</option>
                  <option value="Affluent">Affluent</option>
                  <option value="Any">Any</option>
                </select>
                {errors.partnerEconomicCondition && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.partnerEconomicCondition}
                  </p>
                )}
              </div>

              {/* Specific Characteristics */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any specific characteristics or qualities you expect in your
                  partner?
                </label>
                <textarea
                  name="specificCharacteristics"
                  value={formData.specificCharacteristics}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Describe any specific qualities, characteristics, or requirements you seek in your partner"
                />
              </div>

              {/* Contact Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Contact Information
                </h4>
                <div className="w-full h-px bg-gray-200 mb-6"></div>

                <div className="space-y-6">
                  {/* How to Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How would you like interested individuals to contact you?
                      *
                    </label>
                    <textarea
                      name="contactInformation"
                      value={formData.contactInformation}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-3 py-2 border ${
                        errors.contactInformation
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md focus:outline-none focus:ring-rose-500 focus:border-rose-500`}
                      placeholder="Please provide your contact details (phone number, email, WhatsApp, etc.) and any specific instructions for how you prefer to be contacted."
                    />
                    {errors.contactInformation && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.contactInformation}
                      </p>
                    )}
                    <div className="mt-3 p-3 bg-amber-50 border-4 border-black rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Important:</strong> This information will be
                        visible to other users when they view your profile.
                        Please provide accurate and up-to-date contact details
                        so potential matches can reach out to you easily.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Declaration
                </h4>
                <div className="w-full h-px bg-gray-200 mb-6"></div>

                <div className="border border-black rounded-lg p-6 space-y-6">
                  {/* Guardian Knowledge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Did your guardian know that you submitted a biodata on
                      this website? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="guardianKnowledge"
                          value="Yes"
                          checked={formData.guardianKnowledge === "Yes"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="guardianKnowledge"
                          value="No"
                          checked={formData.guardianKnowledge === "No"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        No
                      </label>
                    </div>
                    {errors.guardianKnowledge && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.guardianKnowledge}
                      </p>
                    )}
                  </div>

                  {/* Information Truthfulness */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Do you testify that all the information you have provided
                      is true? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="informationTruthfulness"
                          value="Yes"
                          checked={formData.informationTruthfulness === "Yes"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="informationTruthfulness"
                          value="No"
                          checked={formData.informationTruthfulness === "No"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        No
                      </label>
                    </div>
                    {errors.informationTruthfulness && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.informationTruthfulness}
                      </p>
                    )}
                  </div>

                  {/* False Information Agreement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Do you agree that if any false information is provided,
                      the website will not be responsible for the consequences?
                      *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="falseInformationAgreement"
                          value="Yes"
                          checked={formData.falseInformationAgreement === "Yes"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="falseInformationAgreement"
                          value="No"
                          checked={formData.falseInformationAgreement === "No"}
                          onChange={handleChange}
                          className="mr-2 text-rose-600 focus:ring-rose-500"
                        />
                        No
                      </label>
                    </div>
                    {errors.falseInformationAgreement && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.falseInformationAgreement}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {authLoading || componentLoading ? (
        <PageSpinner text="Loading..." />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-8 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-rose-200/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-100/10 to-rose-100/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 bg-gradient-to-r from-rose-500 to-pink-600 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Create Your Biodata
                    </h1>
                    <p className="text-rose-100 text-sm mt-1">
                      Step {currentStep} of {totalSteps}:{" "}
                      {getStepName(currentStep)}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-rose-200" />
                    <span className="text-rose-100 text-sm font-medium">
                      Secure & Private
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gradient-to-r from-white/30 to-white/20 px-8 py-6 border-b border-white/20 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  {/* Progress Steps - CSS Grid Layout for Perfect Alignment */}
                  <div className="w-full max-w-4xl">
                    {/* Circles and Lines Row */}
                    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                      {[1, 2, 3, 4].map((step, index) => {
                        const stepLabels = [
                          "Family",
                          "Education",
                          "Lifestyle",
                          "Partner",
                        ];
                        const isCompleted = step < currentStep;
                        const isCurrent = step === currentStep;
                        const isUpcoming = step > currentStep;
                        const isLast = index === 3;

                        return (
                          <>
                            {/* Circle */}
                            <div className="flex flex-col items-center">
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{
                                  scale: 1,
                                  rotate: 0,
                                  boxShadow:
                                    isCompleted || isCurrent
                                      ? "0 0 20px rgba(244, 114, 182, 0.5)"
                                      : "0 0 0px rgba(0, 0, 0, 0)",
                                }}
                                transition={{
                                  delay: step * 0.15,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20,
                                }}
                                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500 ${
                                  isCompleted || isCurrent
                                    ? "bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 text-white shadow-2xl"
                                    : "bg-white/60 text-gray-400 border-2 border-gray-300/50 backdrop-blur-sm hover:bg-white/80 hover:border-gray-400/50"
                                }`}
                              >
                                {isCompleted ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      delay: step * 0.2,
                                      type: "spring",
                                    }}
                                  >
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </motion.div>
                                ) : (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: step * 0.2 }}
                                  >
                                    {step}
                                  </motion.span>
                                )}

                                {/* Glow effect for completed/current steps */}
                                {(isCompleted || isCurrent) && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    transition={{
                                      duration: 0.5,
                                      delay: step * 0.3,
                                    }}
                                    className="absolute inset-1 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 blur-sm"
                                  />
                                )}
                              </motion.div>
                            </div>

                            {/* Connecting Line - Only between circles, not after last */}
                            {!isLast && (
                              <div className="flex items-center px-1 sm:px-2">
                                <div className="relative w-8 sm:w-16 md:w-24 h-1 bg-gray-300/60 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0, x: "-100%" }}
                                    animate={{
                                      width: isCompleted ? "100%" : "0%",
                                      x: isCompleted ? "0%" : "-100%",
                                    }}
                                    transition={{
                                      duration: 0.8,
                                      delay: step * 0.2,
                                      ease: "easeInOut",
                                    }}
                                    className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-purple-600 rounded-full relative shadow-sm"
                                  ></motion.div>

                                  {/* Animated particles */}
                                  {isCompleted && (
                                    <>
                                      {[...Array(3)].map((_, i) => (
                                        <motion.div
                                          key={i}
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0, 1, 0],
                                            y: [-5, -10, -5],
                                          }}
                                          transition={{
                                            duration: 1,
                                            delay: step * 0.3 + i * 0.2,
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                          }}
                                          className="absolute top-0 left-1/4 w-1 h-1 bg-rose-400 rounded-full"
                                          style={{ left: `${25 + i * 25}%` }}
                                        />
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })}
                    </div>

                    {/* Labels Row */}
                    <div className="flex items-start justify-center gap-2 sm:gap-4">
                      {[1, 2, 3, 4].map((step, index) => {
                        const stepLabels = [
                          "Family",
                          "Education",
                          "Lifestyle",
                          "Partner",
                        ];
                        const isCompleted = step < currentStep;
                        const isCurrent = step === currentStep;
                        const isUpcoming = step > currentStep;
                        const isLast = index === 3;

                        return (
                          <>
                            {/* Label */}
                            <motion.span
                              initial={{ opacity: 0, y: 5 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                color:
                                  isCompleted || isCurrent
                                    ? "#dc2626"
                                    : "#6b7280",
                                scale: isCurrent ? 1.05 : 1,
                              }}
                              transition={{
                                delay: step * 0.2 + 0.1,
                                duration: 0.3,
                              }}
                              className="px-1 sm:px-2 py-1 text-xs font-medium rounded-full bg-white/40 backdrop-blur-sm whitespace-nowrap text-center transition-colors duration-300"
                            >
                              {stepLabels[index]}
                            </motion.span>

                            {/* Empty space for line alignment */}
                            {!isLast && <div className="w-16 sm:w-24"></div>}
                          </>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="p-8"
              >
                {/* Display general errors */}
                {errors.general && (
                  <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-amber-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Biodata Creation Restricted
                        </h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>{errors.general}</p>
                        </div>
                        <div className="mt-4">
                          <div className="-mx-2 -my-1.5 flex">
                            <button
                              onClick={() => navigate("/search")}
                              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                            >
                              Browse Profiles
                            </button>
                            <button
                              onClick={() => navigate("/profile")}
                              className="ml-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
                            >
                              Go Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display backend errors */}
                {Object.keys(errors).some((key) =>
                  key.startsWith("error_")
                ) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 font-semibold mb-2">
                      Please check the following fields:
                    </p>
                    <ul className="list-disc list-inside text-red-600">
                      {Object.keys(errors)
                        .filter((key) => key.startsWith("error_"))
                        .map((key) => (
                          <li key={key}>{errors[key]}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {renderStepContent()}
              </motion.div>

              {/* Navigation */}
              <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-t border-white/20 flex justify-between items-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentStep === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:shadow-md cursor-pointer"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </motion.button>

                {currentStep < totalSteps ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex items-center bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateBiodataClick}
                    disabled={isLoading}
                    className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                      isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <ButtonSpinner className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Biodata
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
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
            className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center overflow-hidden"
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
                Profile Created Successfully!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-white/90 text-sm"
              >
                Your biodata has been created!
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 backdrop-blur-sm ${
            notification.type === "success"
              ? "bg-green-500 border border-green-600 text-white"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-3 max-w-sm">
            {notification.type === "success" ? (
              <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-red-600" />
              </div>
            )}
            <span className="font-medium text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
