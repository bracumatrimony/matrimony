/**
 * Utility functions for formatting error messages
 */

/**
 * Format MongoDB validation errors into user-friendly messages
 * @param {Error} error - MongoDB validation error
 * @returns {Object} Formatted error response
 */
const formatValidationError = (error) => {
  if (error.name === "ValidationError") {
    const errors = {};
    const messages = [];

    Object.keys(error.errors).forEach((key) => {
      const err = error.errors[key];
      let message = "";

      switch (err.kind) {
        case "required":
          message = `${formatFieldName(key)} is required`;
          break;
        case "min":
          if (key === "age") {
            message = `Age must be at least ${err.properties.min} years old`;
          } else {
            message = `${formatFieldName(key)} must be at least ${
              err.properties.min
            }`;
          }
          break;
        case "max":
          if (key === "age") {
            message = `Age cannot exceed ${err.properties.max} years`;
          } else {
            message = `${formatFieldName(key)} cannot exceed ${
              err.properties.max
            }`;
          }
          break;
        case "enum":
          message = `${formatFieldName(
            key
          )} must be one of: ${err.properties.enumValues.join(", ")}`;
          break;
        case "minlength":
          message = `${formatFieldName(key)} must be at least ${
            err.properties.minlength
          } characters long`;
          break;
        case "maxlength":
          message = `${formatFieldName(key)} cannot exceed ${
            err.properties.maxlength
          } characters`;
          break;
        default:
          message = err.message || `Invalid value for ${formatFieldName(key)}`;
      }

      errors[key] = message;
      messages.push(message);
    });

    return {
      type: "validation",
      message: "Please check the following fields and try again",
      errors,
      details: messages,
    };
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      type: "duplicate",
      message: `${formatFieldName(field)} already exists`,
      field,
    };
  }

  // Handle cast errors
  if (error.name === "CastError") {
    return {
      type: "cast",
      message: `Invalid value provided for ${formatFieldName(error.path)}`,
      field: error.path,
    };
  }

  // Default error
  return {
    type: "unknown",
    message: "An unexpected error occurred. Please try again later",
  };
};

/**
 * Format field names to be more readable
 * @param {string} fieldName - Raw field name
 * @returns {string} Formatted field name
 */
const formatFieldName = (fieldName) => {
  const fieldMappings = {
    fullName: "Full Name",
    dateOfBirth: "Date of Birth",
    phoneNumber: "Phone Number",
    emergencyContact: "Emergency Contact",
    presentAddress: "Present Address",
    permanentAddress: "Permanent Address",
    educationLevel: "Education Level",
    graduationYear: "Graduation Year",
    monthlyIncome: "Monthly Income",
    fatherName: "Father's Name",
    fatherProfession: "Father's Profession",
    motherName: "Mother's Name",
    motherProfession: "Mother's Profession",
    familyFinancialCondition: "Family Financial Condition",
    partnerAgeRange: "Partner Age Range",
    partnerEducation: "Partner Education Preference",
    partnerProfession: "Partner Profession Preference",
    partnerLocation: "Partner Location Preference",
    additionalRequirements: "Additional Requirements",
    bloodGroup: "Blood Group",
    workingLocation: "Working Location",
  };

  return (
    fieldMappings[fieldName] ||
    fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
};

/**
 * Get appropriate HTTP status code for error type
 * @param {string} errorType - Type of error
 * @returns {number} HTTP status code
 */
const getErrorStatusCode = (errorType) => {
  switch (errorType) {
    case "validation":
    case "cast":
    case "duplicate":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "notfound":
      return 404;
    default:
      return 500;
  }
};

module.exports = {
  formatValidationError,
  formatFieldName,
  getErrorStatusCode,
};
