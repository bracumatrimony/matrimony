
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
  { value: "International", label: "Outside Bangladesh" },
];

export const getDistrictsByDivision = async () => {
  return districtsByDivision;
};

export const getCountries = async () => {
  return districtsByDivision.International;
};


export const locationsByDivision = {
  "": [
    { value: "", label: "Select District/Region" },
    { value: "Any", label: "Any District/Region" },
  ],
  Dhaka: districtsByDivision.Dhaka,
  Chittagong: districtsByDivision.Chittagong,
  Rajshahi: districtsByDivision.Rajshahi,
  Khulna: districtsByDivision.Khulna,
  Barisal: districtsByDivision.Barisal,
  Sylhet: districtsByDivision.Sylhet,
  Rangpur: districtsByDivision.Rangpur,
  Mymensingh: districtsByDivision.Mymensingh,
  International: districtsByDivision.International,
};


export { districtsByDivision };
