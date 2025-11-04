

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


const getUniversityConfig = (universityKey) => {
  return universities[universityKey] || null;
};


const getAllUniversities = () => {
  return universities;
};


const detectUniversityFromEmail = (email) => {
  if (!email) return null;

  email = email.toLowerCase().trim();

  for (const [key, config] of Object.entries(universities)) {
    if (config.emailDomains.some((domain) => email.endsWith(domain))) {
      return { key, ...config };
    }
  }

  return null;
};


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
