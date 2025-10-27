// Frontend validation utility for new biodata form structure

export const validateProfileData = (formData) => {
  const errors = {};

  // Segment 1: Family Background
  if (!formData.fatherAlive) {
    errors.fatherAlive = "Father's status is required";
  }

  if (formData.fatherAlive === "Yes" && !formData.fatherOccupation?.trim()) {
    errors.fatherOccupation = "Father's occupation details are required";
  }

  if (!formData.motherAlive) {
    errors.motherAlive = "Mother's status is required";
  }

  if (formData.motherAlive === "Yes" && !formData.motherOccupation?.trim()) {
    errors.motherOccupation = "Mother's occupation details are required";
  }

  if (
    formData.brothersCount === undefined ||
    formData.brothersCount === null ||
    formData.brothersCount === ""
  ) {
    errors.brothersCount = "Number of brothers is required";
  } else if (formData.brothersCount < 0) {
    errors.brothersCount = "Number of brothers cannot be negative";
  }

  if (
    formData.sistersCount === undefined ||
    formData.sistersCount === null ||
    formData.sistersCount === ""
  ) {
    errors.sistersCount = "Number of sisters is required";
  } else if (formData.sistersCount < 0) {
    errors.sistersCount = "Number of sisters cannot be negative";
  }

  if (!formData.familyEconomicCondition) {
    errors.familyEconomicCondition = "Family economic condition is required";
  }

  // Segment 2: Education & Profession
  if (!formData.educationMedium) {
    errors.educationMedium = "Education medium is required";
  }

  if (!formData.hscPassingYear) {
    errors.hscPassingYear = "HSC passing year is required";
  } else if (formData.hscPassingYear < 1990 || formData.hscPassingYear > 2030) {
    errors.hscPassingYear = "HSC passing year must be between 1990 and 2030";
  }

  if (!formData.hscGroup?.trim()) {
    errors.hscGroup = "HSC group is required";
  }

  if (!formData.hscResult?.trim()) {
    errors.hscResult = "HSC result is required";
  }

  if (!formData.profession?.trim()) {
    errors.profession = "Profession is required";
  }

  if (!formData.professionDescription?.trim()) {
    errors.professionDescription = "Profession description is required";
  }

  if (!formData.monthlyIncome) {
    errors.monthlyIncome = "Monthly income is required";
  }

  // Segment 3: Lifestyle, Health & Compatibility
  if (!formData.religion) {
    errors.religion = "Religion is required";
  }

  if (!formData.religiousPractices?.trim()) {
    errors.religiousPractices = "Religious practices information is required";
  }

  if (!formData.practiceFrequency) {
    errors.practiceFrequency = "Practice frequency is required";
  }

  if (!formData.mentalPhysicalIllness?.trim()) {
    errors.mentalPhysicalIllness = "Health information is required";
  }

  if (!formData.hobbiesLikesDislikesDreams?.trim()) {
    errors.hobbiesLikesDislikesDreams =
      "Hobbies, likes, dislikes, and dreams information is required";
  }

  // Segment 4: Expected Life Partner & Declaration
  if (!formData.partnerAgePreference?.trim()) {
    errors.partnerAgePreference = "Partner age preference is required";
  }

  if (!formData.partnerSkinTone) {
    errors.partnerSkinTone = "Partner skin tone preference is required";
  }

  if (!formData.partnerHeight?.trim()) {
    errors.partnerHeight = "Partner height preference is required";
  }

  if (!formData.partnerEducation?.trim()) {
    errors.partnerEducation = "Partner education preference is required";
  }

  if (!formData.partnerDistrictRegion?.trim()) {
    errors.partnerDistrictRegion =
      "Partner district/region preference is required";
  }

  if (!formData.partnerMaritalStatus) {
    errors.partnerMaritalStatus =
      "Partner marital status preference is required";
  }

  if (!formData.partnerProfession?.trim()) {
    errors.partnerProfession = "Partner profession preference is required";
  }

  if (!formData.partnerEconomicCondition) {
    errors.partnerEconomicCondition =
      "Partner economic condition preference is required";
  }

  if (!formData.guardianKnowledge) {
    errors.guardianKnowledge = "Guardian knowledge confirmation is required";
  } else if (formData.guardianKnowledge !== "Yes") {
    errors.guardianKnowledge =
      "You must confirm that your guardian/family knows about this biodata";
  }

  if (!formData.informationTruthfulness) {
    errors.informationTruthfulness =
      "Information truthfulness confirmation is required";
  } else if (formData.informationTruthfulness !== "Yes") {
    errors.informationTruthfulness =
      "You must confirm that all information provided is truthful";
  }

  if (!formData.falseInformationAgreement) {
    errors.falseInformationAgreement =
      "False information agreement is required";
  } else if (formData.falseInformationAgreement !== "Yes") {
    errors.falseInformationAgreement =
      "You must agree that providing false information will result in permanent account suspension";
  }

  return errors;
};

// Step-by-step validation for better UX
export const validateStep = (step, formData) => {
  const errors = {};

  switch (step) {
    case 1: // Family Background
      if (!formData.fatherAlive)
        errors.fatherAlive = "Father's status is required";
      if (
        formData.fatherAlive === "Yes" &&
        !formData.fatherOccupation?.trim()
      ) {
        errors.fatherOccupation = "Father's occupation details are required";
      }
      if (!formData.motherAlive)
        errors.motherAlive = "Mother's status is required";
      if (
        formData.motherAlive === "Yes" &&
        !formData.motherOccupation?.trim()
      ) {
        errors.motherOccupation = "Mother's occupation details are required";
      }
      if (
        formData.brothersCount === undefined ||
        formData.brothersCount === null ||
        formData.brothersCount === ""
      ) {
        errors.brothersCount = "Number of brothers is required";
      }
      if (
        formData.sistersCount === undefined ||
        formData.sistersCount === null ||
        formData.sistersCount === ""
      ) {
        errors.sistersCount = "Number of sisters is required";
      }
      if (!formData.familyEconomicCondition) {
        errors.familyEconomicCondition =
          "Family economic condition is required";
      }
      break;

    case 2: // Education & Profession
      if (!formData.educationMedium)
        errors.educationMedium = "Education medium is required";
      if (!formData.hscPassingYear) {
        errors.hscPassingYear = "HSC passing year is required";
      } else if (
        formData.hscPassingYear < 1990 ||
        formData.hscPassingYear > 2030
      ) {
        errors.hscPassingYear =
          "HSC passing year must be between 1990 and 2030";
      }
      if (!formData.hscGroup?.trim()) errors.hscGroup = "HSC group is required";
      if (!formData.hscResult?.trim())
        errors.hscResult = "HSC result is required";
      if (!formData.profession?.trim())
        errors.profession = "Profession is required";
      if (!formData.professionDescription?.trim()) {
        errors.professionDescription = "Profession description is required";
      }
      if (!formData.monthlyIncome)
        errors.monthlyIncome = "Monthly income is required";
      break;

    case 3: // Lifestyle, Health & Compatibility
      if (!formData.gender) {
        errors.gender = "Gender is required";
      }
      if (!formData.religion) {
        errors.religion = "Religion is required";
      }
      if (!formData.age) {
        errors.age = "Age is required";
      } else if (formData.age < 18 || formData.age > 100) {
        errors.age = "Age must be between 18 and 100";
      }
      if (!formData.height) {
        errors.height = "Height is required";
      }
      if (!formData.weight) {
        errors.weight = "Weight is required";
      }
      if (!formData.skinTone) {
        errors.skinTone = "Skin tone is required";
      }
      if (!formData.maritalStatus) {
        errors.maritalStatus = "Marital status is required";
      }
      if (!formData.presentAddressDivision?.trim()) {
        errors.presentAddressDivision = "Present address division is required";
      }
      if (!formData.presentAddressDistrict?.trim()) {
        errors.presentAddressDistrict = "Present address district is required";
      }
      if (!formData.permanentAddressDivision?.trim()) {
        errors.permanentAddressDivision =
          "Permanent address division is required";
      }
      if (!formData.permanentAddressDistrict?.trim()) {
        errors.permanentAddressDistrict =
          "Permanent address district is required";
      }
      if (!formData.religiousPractices?.trim()) {
        errors.religiousPractices =
          "Religious practices information is required";
      }
      if (!formData.practiceFrequency)
        errors.practiceFrequency = "Practice frequency is required";
      if (!formData.mentalPhysicalIllness?.trim()) {
        errors.mentalPhysicalIllness = "Health information is required";
      }
      if (!formData.hobbiesLikesDislikesDreams?.trim()) {
        errors.hobbiesLikesDislikesDreams =
          "Hobbies, likes, dislikes, and dreams information is required";
      }
      break;

    case 4: // Expected Life Partner & Declaration
      if (
        !formData.partnerAgePreferenceMin ||
        !formData.partnerAgePreferenceMax
      ) {
        errors.partnerAgePreferenceMin =
          "Partner age preference range is required";
      }
      if (!formData.partnerSkinTone)
        errors.partnerSkinTone = "Partner skin tone preference is required";
      if (!formData.partnerHeightMin || !formData.partnerHeightMax) {
        errors.partnerHeightMin = "Partner height preference range is required";
      }
      if (!formData.partnerEducation?.trim()) {
        errors.partnerEducation = "Partner education preference is required";
      }
      if (!formData.partnerDistrictRegion?.trim()) {
        errors.partnerDistrictRegion =
          "Partner district/region preference is required";
      }
      if (!formData.partnerMaritalStatus) {
        errors.partnerMaritalStatus =
          "Partner marital status preference is required";
      }
      if (!formData.partnerProfession?.trim()) {
        errors.partnerProfession = "Partner profession preference is required";
      }
      if (!formData.partnerEconomicCondition) {
        errors.partnerEconomicCondition =
          "Partner economic condition preference is required";
      }
      if (!formData.guardianKnowledge) {
        errors.guardianKnowledge =
          "Guardian knowledge confirmation is required";
      } else if (formData.guardianKnowledge !== "Yes") {
        errors.guardianKnowledge =
          "You must confirm that your guardian/family knows about this biodata";
      }
      if (!formData.informationTruthfulness) {
        errors.informationTruthfulness =
          "Information truthfulness confirmation is required";
      } else if (formData.informationTruthfulness !== "Yes") {
        errors.informationTruthfulness =
          "You must confirm that all information provided is truthful";
      }
      if (!formData.falseInformationAgreement) {
        errors.falseInformationAgreement =
          "False information agreement is required";
      } else if (formData.falseInformationAgreement !== "Yes") {
        errors.falseInformationAgreement =
          "You must agree that providing false information will result in permanent account suspension";
      }
      // Contact Information validation
      if (!formData.contactInformation?.trim()) {
        errors.contactInformation = "Contact information is required";
      } else if (formData.contactInformation.trim().length < 10) {
        errors.contactInformation =
          "Contact information must be at least 10 characters long";
      } else if (formData.contactInformation.trim().length > 500) {
        errors.contactInformation =
          "Contact information cannot exceed 500 characters";
      }

      // Personal Contact Information validation (required for admins)
      if (!formData.personalContactInfo?.trim()) {
        errors.personalContactInfo = "Personal contact information is required";
      } else if (formData.personalContactInfo.trim().length < 5) {
        errors.personalContactInfo =
          "Personal contact information must be at least 5 characters long";
      } else if (formData.personalContactInfo.trim().length > 1000) {
        errors.personalContactInfo =
          "Personal contact information cannot exceed 1000 characters";
      }
      break;
  }

  return errors;
};

export const getStepName = (step) => {
  const stepNames = {
    1: "Family Background",
    2: "Education & Profession",
    3: "Lifestyle, Health & Compatibility",
    4: "Expected Life Partner & Declaration",
  };
  return stepNames[step] || `Step ${step}`;
};
