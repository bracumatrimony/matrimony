// Bangladesh Location Data Structure
import { districtsByDivision } from "./districtsData.js";

export const divisions = [
  { value: "", label: "Select Division" },
  { value: "Dhaka", label: "Dhaka Division" },
  { value: "Chittagong", label: "Chittagong Division" },
  { value: "Rajshahi", label: "Rajshahi Division" },
  { value: "Khulna", label: "Khulna Division" },
  { value: "Barisal", label: "Barisal Division" },
  { value: "Sylhet", label: "Sylhet Division" },
  { value: "Rangpur", label: "Rangpur Division" },
  { value: "Mymensingh", label: "Mymensingh Division" },
  { value: "International", label: "International" },
];

export const getDistrictsByDivision = async () => {
  return districtsByDivision;
};

export const getCountries = async () => {
  return districtsByDivision.International;
};

// Group locations by division for easier rendering
export const locationsByDivision = {
  "": [
    { value: "", label: "Select District/Region" },
    { value: "Any", label: "Any District/Region" },
  ],
  "Dhaka Division": districtsByDivision.Dhaka,
  "Chittagong Division": districtsByDivision.Chittagong,
  "Rajshahi Division": districtsByDivision.Rajshahi,
  "Khulna Division": districtsByDivision.Khulna,
  "Barisal Division": districtsByDivision.Barisal,
  "Sylhet Division": districtsByDivision.Sylhet,
  "Rangpur Division": districtsByDivision.Rangpur,
  "Mymensingh Division": districtsByDivision.Mymensingh,
  International: districtsByDivision.International,
};

// Re-export for backward compatibility
export { districtsByDivision };
