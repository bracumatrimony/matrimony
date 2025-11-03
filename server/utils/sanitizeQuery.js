// Utility functions to prevent MongoDB injection attacks
// by sanitizing user inputs used in MongoDB queries

/**
 * Sanitizes a string value to prevent MongoDB operator injection
 * @param {string} value - The input value to sanitize
 * @param {string[]} allowedValues - Array of allowed exact values (optional)
 * @returns {string|null} - Sanitized value or null if invalid
 */
const sanitizeStringValue = (value, allowedValues = null) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Check if it's an allowed value
  if (allowedValues && !allowedValues.includes(trimmed)) {
    return null;
  }

  // Check for MongoDB operators
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  return trimmed;
};

/**
 * Sanitizes a numeric value to prevent MongoDB operator injection
 * @param {string|number} value - The input value to sanitize
 * @param {number} min - Minimum allowed value (optional)
 * @param {number} max - Maximum allowed value (optional)
 * @returns {number|null} - Sanitized number or null if invalid
 */
const sanitizeNumericValue = (value, min = null, max = null) => {
  if (value === null || value === undefined || value === "") return null;

  const num = parseInt(value, 10);
  if (isNaN(num)) return null;

  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;

  return num;
};

/**
 * Escapes special regex characters to prevent regex injection
 * @param {string} value - The input string to escape
 * @returns {string} - Escaped string safe for regex
 */
const escapeRegex = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Sanitizes search query parameters for profile filtering
 * @param {object} query - The request query object
 * @returns {object} - Sanitized filters object
 */
const sanitizeProfileSearchQuery = (query) => {
  const filters = { status: "approved" };

  // Text search - escape regex special characters
  if (query.search && typeof query.search === "string") {
    const searchTerm = escapeRegex(query.search.trim());
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      filters.$or = [
        { educationLevel: searchRegex },
        { profession: searchRegex },
        { presentAddressDistrict: searchRegex },
        { permanentAddressDistrict: searchRegex },
        { sscGroup: searchRegex },
        { bracu_department: searchRegex },
      ];
    }
  }

  // Gender - exact match from allowed values
  if (query.gender) {
    const sanitizedGender = sanitizeStringValue(query.gender, [
      "Male",
      "Female",
    ]);
    if (sanitizedGender) {
      filters.gender = sanitizedGender;
    }
  }

  // Age range - numeric validation
  const minAge = sanitizeNumericValue(query.minAge, 18, 100);
  const maxAge = sanitizeNumericValue(query.maxAge, 18, 100);
  if (minAge || maxAge) {
    filters.age = {};
    if (minAge) filters.age.$gte = minAge;
    if (maxAge) filters.age.$lte = maxAge;
  }

  // Religion - exact match from allowed values
  if (query.religion) {
    const sanitizedReligion = sanitizeStringValue(query.religion, [
      "Muslim",
      "Hindu",
      "Christian",
      "Buddhist",
      "Other",
    ]);
    if (sanitizedReligion) {
      filters.religion = sanitizedReligion;
    }
  }

  // Education - use regex with escaped input
  if (query.education && typeof query.education === "string") {
    const educationTerm = escapeRegex(query.education.trim());
    if (educationTerm) {
      filters.educationLevel = { $regex: new RegExp(`^${educationTerm}`, "i") };
    }
  }

  // Profession - use regex with escaped input
  if (query.profession && typeof query.profession === "string") {
    const professionTerm = escapeRegex(query.profession.trim());
    if (professionTerm) {
      filters.profession = { $regex: new RegExp(`^${professionTerm}`, "i") };
    }
  }

  // District - use regex with escaped input
  if (query.district && query.district !== "Any" && query.district.trim()) {
    const districtTerm = escapeRegex(query.district.trim());
    if (districtTerm) {
      const districtFilter = {
        $or: [
          { presentAddressDistrict: { $regex: new RegExp(districtTerm, "i") } },
          {
            permanentAddressDistrict: { $regex: new RegExp(districtTerm, "i") },
          },
        ],
      };

      // If search is already using $or, combine with $and
      if (filters.$or) {
        filters.$and = [{ $or: filters.$or }, districtFilter];
        delete filters.$or;
      } else {
        filters.$or = districtFilter.$or;
      }
    }
  }

  // University - exact match from config
  if (query.university) {
    const universities = require("../config/universities").getAllUniversities();
    const allowedUniversities = Object.keys(universities);
    const sanitizedUniversity = sanitizeStringValue(
      query.university,
      allowedUniversities
    );
    if (sanitizedUniversity) {
      filters.university = sanitizedUniversity;
    }
  }

  return filters;
};

/**
 * Sanitizes an ID parameter to prevent MongoDB operator injection
 * @param {string} id - The ID parameter to sanitize
 * @returns {string|null} - Sanitized ID or null if invalid
 */
const sanitizeId = (id) => {
  if (!id || typeof id !== "string") return null;

  const trimmed = id.trim();
  if (!trimmed) return null;

  // Check for MongoDB operators
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  // Basic validation - should not contain spaces or special chars that could be operators
  if (/[\s\{\}\[\]\$]/.test(trimmed)) {
    return null;
  }

  return trimmed;
};

/**
 * Sanitizes a general search query for admin use
 * @param {string} search - The search string to sanitize
 * @returns {string|null} - Sanitized search string or null if invalid
 */
const sanitizeSearchQuery = (search) => {
  if (!search || typeof search !== "string") return null;

  const trimmed = search.trim();
  if (!trimmed) return null;

  // Check for MongoDB operators
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  // For admin searches, we'll escape regex but allow more flexibility
  return escapeRegex(trimmed);
};

module.exports = {
  sanitizeStringValue,
  sanitizeNumericValue,
  escapeRegex,
  sanitizeProfileSearchQuery,
  sanitizeId,
  sanitizeSearchQuery,
};
