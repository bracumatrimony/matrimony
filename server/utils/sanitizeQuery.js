



const sanitizeStringValue = (value, allowedValues = null) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  
  if (allowedValues && !allowedValues.includes(trimmed)) {
    return null;
  }

  
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  return trimmed;
};


const sanitizeNumericValue = (value, min = null, max = null) => {
  if (value === null || value === undefined || value === "") return null;

  const num = parseInt(value, 10);
  if (isNaN(num)) return null;

  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;

  return num;
};


const escapeRegex = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


const sanitizeProfileSearchQuery = (query) => {
  const filters = { status: "approved" };

  
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

  
  if (query.gender) {
    const sanitizedGender = sanitizeStringValue(query.gender, [
      "Male",
      "Female",
    ]);
    if (sanitizedGender) {
      filters.gender = sanitizedGender;
    }
  }

  
  const minAge = sanitizeNumericValue(query.minAge, 18, 100);
  const maxAge = sanitizeNumericValue(query.maxAge, 18, 100);
  if (minAge || maxAge) {
    filters.age = {};
    if (minAge) filters.age.$gte = minAge;
    if (maxAge) filters.age.$lte = maxAge;
  }

  
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

  
  if (query.education && typeof query.education === "string") {
    const educationTerm = escapeRegex(query.education.trim());
    if (educationTerm) {
      filters.educationLevel = { $regex: new RegExp(`^${educationTerm}`, "i") };
    }
  }

  
  if (query.profession && typeof query.profession === "string") {
    const professionTerm = escapeRegex(query.profession.trim());
    if (professionTerm) {
      filters.profession = { $regex: new RegExp(`^${professionTerm}`, "i") };
    }
  }

  
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

      
      if (filters.$or) {
        filters.$and = [{ $or: filters.$or }, districtFilter];
        delete filters.$or;
      } else {
        filters.$or = districtFilter.$or;
      }
    }
  }

  
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


const sanitizeId = (id) => {
  if (!id || typeof id !== "string") return null;

  const trimmed = id.trim();
  if (!trimmed) return null;

  
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  
  if (/[\s\{\}\[\]\$]/.test(trimmed)) {
    return null;
  }

  return trimmed;
};


const sanitizeSearchQuery = (search) => {
  if (!search || typeof search !== "string") return null;

  const trimmed = search.trim();
  if (!trimmed) return null;

  
  if (
    trimmed.startsWith("$") ||
    trimmed.includes("{$") ||
    trimmed.includes("{ $")
  ) {
    return null;
  }

  
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
