/**
 * University Configuration
 * This file contains all university-specific settings for the matrimony platform.
 * To add a new university, simply add a new entry to the universities object.
 */

const universities = {
  BRACU: {
    name: "BRAC University",
    emailDomains: ["@bracu.ac.bd", "@g.bracu.ac.bd"],
    idPrefix: "BRACU",
    startingID: 1000,
    bannerImage:
      "https://res.cloudinary.com/dkir6pztp/image/upload/v1761851807/brac_campus_wdavos.jpg",
  },
  NSU: {
    name: "North South University",
    emailDomains: ["@northsouth.edu"],
    idPrefix: "NSU",
    startingID: 50000,
    bannerImage:
      "https://res.cloudinary.com/dkir6pztp/image/upload/v1761851808/north_south_campus_jsidul.jpg",
  },
};

/**
 * Get university configuration by key
 * @param {string} universityKey - The university key (e.g., 'BRACU', 'NSU')
 * @returns {object|null} University configuration or null if not found
 */
const getUniversityConfig = (universityKey) => {
  return universities[universityKey] || null;
};

/**
 * Get all university configurations
 * @returns {object} All university configurations
 */
const getAllUniversities = () => {
  return universities;
};

/**
 * Detect university from email domain
 * @param {string} email - User email address
 * @returns {object|null} University configuration or null if not recognized
 */
const detectUniversityFromEmail = (email) => {
  if (!email) return null;

  for (const [key, config] of Object.entries(universities)) {
    if (config.emailDomains.some((domain) => email.endsWith(domain))) {
      return { key, ...config };
    }
  }

  return null;
};

/**
 * Check if email domain is valid for any university
 * @param {string} email - User email address
 * @returns {boolean} True if email domain is recognized
 */
const isValidUniversityEmail = (email) => {
  return detectUniversityFromEmail(email) !== null;
};

module.exports = {
  universities,
  getUniversityConfig,
  getAllUniversities,
  detectUniversityFromEmail,
  isValidUniversityEmail,
};
