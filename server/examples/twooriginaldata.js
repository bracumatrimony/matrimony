require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Profile = require("../models/Profile");

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://aditto:none@matrimonycluster.pafedm3.mongodb.net/bracu_matrimony?retryWrites=true&w=majority";

// Professional disclaimer for demo profiles
const DEMO_CONTACT_DISCLAIMER = `
DEMONSTRATION PROFILE DISCLAIMER:

This biodata has been created solely for demonstration purposes to showcase the functionality and structure of this matrimonial platform.`.trim();

// Realistic biodata data for demonstration
const maleBiodata = {
  // User Info
  email: "demo.male@g.bracu.ac.bd",
  name: "Ahmed Hassan Khan",
  profileId: "BRACU9001",
  gender: "Male",
  religion: "Muslim",

  // Family Background
  fatherAlive: "Yes",
  fatherOccupation:
    "Senior Government Officer at Bangladesh Civil Service (BCS), currently serving as Deputy Commissioner",
  motherAlive: "Yes",
  motherOccupation:
    "Retired School Teacher from a reputed English Medium School",
  brothersCount: 2,
  brother1Occupation: "Software Engineer at Google, Singapore",
  brother2Occupation: "Final year MBBS student at Dhaka Medical College",
  sistersCount: 1,
  sister1Occupation: "Architect at a renowned architectural firm in Dhaka",
  unclesCount: 3,
  uncle1Occupation: "Business Owner - Import/Export company",
  uncle2Occupation: "University Professor at Dhaka University",
  uncle3Occupation: "Doctor - Consultant at Square Hospital",
  familyEconomicCondition: "Upper-middle",

  // Education & Profession
  educationMedium: "English",
  hscPassingYear: 2018,
  hscGroup: "Science",
  hscResult: "GPA 5.00 (Golden A+)",
  graduationSubject: "Computer Science and Engineering",
  educationalInstitution:
    "BRAC University (BSc in CSE with CGPA 3.92 out of 4.00)",
  currentStudyYear: "Completed",
  otherEducationalQualifications:
    "AWS Certified Solutions Architect, Machine Learning Specialization from Stanford (Coursera)",
  profession: "Senior Software Engineer",
  professionDescription:
    "Working as a Senior Software Engineer at a leading multinational tech company in Dhaka. Specializing in cloud architecture, backend systems, and machine learning applications. Leading a team of 5 engineers on enterprise-level projects.",
  monthlyIncome: "80,000 - 100,000 BDT",

  // Lifestyle, Health & Compatibility
  age: 27,
  height: "5'9\"",
  weight: "72 kg",
  skinTone: "Fair",
  maritalStatus: "Never Married",
  presentAddressDivision: "Dhaka",
  presentAddressDistrict: "Dhaka",
  permanentAddressDivision: "Dhaka",
  permanentAddressDistrict: "Gazipur",
  religiousPractices:
    "Alhamdulillah, I maintain regular prayers (5 times Salah daily), observe fasting during Ramadan, and actively participate in Islamic study circles. I strive to follow the Sunnah in daily life and seek to continuously improve my understanding of the Deen.",
  practiceFrequency: "Daily",
  mentalPhysicalIllness:
    "Alhamdulillah, in good health with no major physical or mental health concerns. Maintain regular exercise routine and annual health check-ups.",
  hobbiesLikesDislikesDreams:
    "Passionate about technology, reading Islamic literature, and contemporary tech books. Enjoy playing cricket, traveling to historical Islamic sites, photography, and contributing to open-source projects. Dream of establishing a tech startup focused on educational technology for underprivileged communities while maintaining strong family values and Islamic principles.",
  partnerStudyAfterMarriage: "Support",
  partnerJobAfterMarriage: "Support",
  preferredLivingLocation: "Dhaka or any major city in Bangladesh",

  // Expected Life Partner
  partnerAgePreference: "22-27 years",
  partnerSkinTone: "Any",
  partnerHeight: "5'2\" - 5'7\"",
  partnerEducation:
    "Minimum Bachelor's degree, preferably in any professional field (Engineering, Medical, Business, Arts, etc.)",
  partnerDistrictRegion:
    "Open to any district in Bangladesh, preferably from Dhaka or nearby areas",
  partnerMaritalStatus: "Single",
  partnerProfession:
    "Open to working professionals, students, or homemakers. Profession is not a constraint; character and values matter most.",
  partnerEconomicCondition: "Any",
  specificCharacteristics:
    "Seeking a life partner who is practicing Muslim with strong Islamic values and good character. Should be respectful, family-oriented, and have good communication skills. Educational qualification and professional background are valued, but kindness, honesty, and commitment to Deen are most important. Someone who understands the balance between modern career aspirations and traditional family values. Mutual respect, understanding, and shared life goals are essential.",

  // Declaration
  guardianKnowledge: "Yes",
  informationTruthfulness: "Yes",
  falseInformationAgreement: "Yes",

  // Contact Information
  contactInformation: DEMO_CONTACT_DISCLAIMER,

  // Status
  status: "approved",
};

const femaleBiodata = {
  // User Info
  email: "demo.female@g.bracu.ac.bd",
  name: "Fatima Rahman Chowdhury",
  profileId: "BRACU9002",
  gender: "Female",
  religion: "Muslim",

  // Family Background
  fatherAlive: "Yes",
  fatherOccupation:
    "Successful Business Owner - owns a pharmaceutical distribution company with operations across Bangladesh",
  motherAlive: "Yes",
  motherOccupation:
    "Homemaker and actively involved in social welfare activities, runs a local Quran teaching center",
  brothersCount: 1,
  brother1Occupation:
    "Chartered Accountant (CA) working at a Big Four accounting firm",
  sistersCount: 2,
  sister1Occupation: "Doctor (MBBS, FCPS) - Gynecologist at a private hospital",
  sister2Occupation:
    "Lecturer at a private university, Department of English Literature",
  unclesCount: 2,
  uncle1Occupation: "Bank Manager at a leading commercial bank",
  uncle2Occupation: "Government official - Deputy Secretary",
  familyEconomicCondition: "Affluent",

  // Education & Profession
  educationMedium: "English",
  hscPassingYear: 2019,
  hscGroup: "Science",
  hscResult: "GPA 5.00 (Golden A+)",
  graduationSubject: "Pharmacy",
  educationalInstitution:
    "BRAC University (B.Pharm with CGPA 3.88 out of 4.00)",
  currentStudyYear: "Completed, considering Masters in Clinical Pharmacy",
  otherEducationalQualifications:
    "Certificate in Clinical Research, Workshop on Drug Regulatory Affairs, Hifdh (memorization) of selected Surahs",
  profession: "Clinical Pharmacist",
  professionDescription:
    "Working as a Clinical Pharmacist at a renowned private hospital in Dhaka. Responsibilities include medication therapy management, patient counseling, drug information services, and collaborating with healthcare professionals to optimize patient care outcomes.",
  monthlyIncome: "40,000 - 60,000 BDT",

  // Lifestyle, Health & Compatibility
  age: 24,
  height: "5'4\"",
  weight: "55 kg",
  skinTone: "Fair",
  maritalStatus: "Never Married",
  presentAddressDivision: "Dhaka",
  presentAddressDistrict: "Dhaka",
  permanentAddressDivision: "Chittagong",
  permanentAddressDistrict: "Chittagong",
  religiousPractices:
    "Alhamdulillah, I maintain regular prayers (5 times Salah daily), wear hijab, observe all Islamic practices including fasting in Ramadan. Actively participate in Islamic study circles and community activities. Strive to live according to Quranic principles and Prophetic traditions.",
  practiceFrequency: "Daily",
  mentalPhysicalIllness:
    "Alhamdulillah, blessed with good health. No significant physical or mental health issues. Maintain healthy lifestyle with balanced diet and regular exercise.",
  hobbiesLikesDislikesDreams:
    "Love reading Islamic books and contemporary literature, enjoy cooking traditional and fusion recipes, passionate about calligraphy (Arabic and Bangla), gardening, and volunteering for community welfare projects. Dream of contributing to healthcare accessibility in rural Bangladesh while building a beautiful Islamic home environment with strong family bonds.",
  partnerStudyAfterMarriage: "",
  partnerJobAfterMarriage: "",
  preferredLivingLocation:
    "Prefer Dhaka or Chittagong, but open to relocate based on mutual decision",

  // Expected Life Partner
  partnerAgePreference: "25-32 years",
  partnerSkinTone: "Any",
  partnerHeight: "5'7\" - 6'1\"",
  partnerEducation:
    "Minimum Bachelor's degree from reputed university. Professional qualifications in Engineering, Medical, Business, or other fields preferred.",
  partnerDistrictRegion:
    "Open to any district, preferably from Dhaka or Chittagong",
  partnerMaritalStatus: "Single",
  partnerProfession:
    "Established in career - Doctor, Engineer, Business professional, Banker, or any respectable profession. Financial stability and career commitment are valued.",
  partnerEconomicCondition: "Upper-middle",
  specificCharacteristics:
    "Seeking a practicing Muslim life partner with strong Islamic values, good character, and family-oriented mindset. Should be respectful towards women's education and career aspirations. Looking for someone who values both Deen and Duniya, maintains balance between professional life and family responsibilities. Must be supportive, understanding, and have good communication skills. Family values, honesty, and commitment to building an Islamic household are essential. Should have respect for in-laws and understand the importance of maintaining family ties.",

  // Declaration
  guardianKnowledge: "Yes",
  informationTruthfulness: "Yes",
  falseInformationAgreement: "Yes",

  // Contact Information
  contactInformation: DEMO_CONTACT_DISCLAIMER,

  // Status
  status: "approved",
};

async function createDemoBiodata() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    console.log("📂 Database:", mongoose.connection.name);

    // Create Male Demo User and Profile
    console.log("\n📝 Creating Male Demo Profile...");
    const malePassword = await bcrypt.hash("Demo1234", 10);

    const maleUser = await User.findOneAndUpdate(
      { email: maleBiodata.email },
      {
        $set: {
          name: maleBiodata.name,
          password: malePassword,
          profileId: maleBiodata.profileId,
          credits: 50,
          emailVerified: true,
          authProvider: "email",
          picture: null,
        },
      },
      { upsert: true, new: true }
    );

    console.log(
      `👤 Male User created: ${maleUser.email} (ID: ${maleUser.profileId})`
    );

    const maleProfile = await Profile.findOneAndUpdate(
      { userId: maleUser._id },
      {
        $set: {
          userId: maleUser._id,
          profileId: maleBiodata.profileId,
          status: maleBiodata.status,

          // Family Background
          fatherAlive: maleBiodata.fatherAlive,
          fatherOccupation: maleBiodata.fatherOccupation,
          motherAlive: maleBiodata.motherAlive,
          motherOccupation: maleBiodata.motherOccupation,
          brothersCount: maleBiodata.brothersCount,
          brother1Occupation: maleBiodata.brother1Occupation,
          brother2Occupation: maleBiodata.brother2Occupation,
          sistersCount: maleBiodata.sistersCount,
          sister1Occupation: maleBiodata.sister1Occupation,
          unclesCount: maleBiodata.unclesCount,
          uncle1Occupation: maleBiodata.uncle1Occupation,
          uncle2Occupation: maleBiodata.uncle2Occupation,
          uncle3Occupation: maleBiodata.uncle3Occupation,
          familyEconomicCondition: maleBiodata.familyEconomicCondition,

          // Education & Profession
          educationMedium: maleBiodata.educationMedium,
          hscPassingYear: maleBiodata.hscPassingYear,
          hscGroup: maleBiodata.hscGroup,
          hscResult: maleBiodata.hscResult,
          graduationSubject: maleBiodata.graduationSubject,
          educationalInstitution: maleBiodata.educationalInstitution,
          currentStudyYear: maleBiodata.currentStudyYear,
          otherEducationalQualifications:
            maleBiodata.otherEducationalQualifications,
          profession: maleBiodata.profession,
          professionDescription: maleBiodata.professionDescription,
          monthlyIncome: maleBiodata.monthlyIncome,

          // Lifestyle, Health & Compatibility
          age: maleBiodata.age,
          height: maleBiodata.height,
          weight: maleBiodata.weight,
          skinTone: maleBiodata.skinTone,
          maritalStatus: maleBiodata.maritalStatus,
          presentAddressDivision: maleBiodata.presentAddressDivision,
          presentAddressDistrict: maleBiodata.presentAddressDistrict,
          permanentAddressDivision: maleBiodata.permanentAddressDivision,
          permanentAddressDistrict: maleBiodata.permanentAddressDistrict,
          gender: maleBiodata.gender,
          religiousPractices: maleBiodata.religiousPractices,
          practiceFrequency: maleBiodata.practiceFrequency,
          mentalPhysicalIllness: maleBiodata.mentalPhysicalIllness,
          hobbiesLikesDislikesDreams: maleBiodata.hobbiesLikesDislikesDreams,
          partnerStudyAfterMarriage: maleBiodata.partnerStudyAfterMarriage,
          partnerJobAfterMarriage: maleBiodata.partnerJobAfterMarriage,
          preferredLivingLocation: maleBiodata.preferredLivingLocation,

          // Expected Life Partner
          partnerAgePreference: maleBiodata.partnerAgePreference,
          partnerSkinTone: maleBiodata.partnerSkinTone,
          partnerHeight: maleBiodata.partnerHeight,
          partnerEducation: maleBiodata.partnerEducation,
          partnerDistrictRegion: maleBiodata.partnerDistrictRegion,
          partnerMaritalStatus: maleBiodata.partnerMaritalStatus,
          partnerProfession: maleBiodata.partnerProfession,
          partnerEconomicCondition: maleBiodata.partnerEconomicCondition,
          specificCharacteristics: maleBiodata.specificCharacteristics,

          // Declaration
          guardianKnowledge: maleBiodata.guardianKnowledge,
          informationTruthfulness: maleBiodata.informationTruthfulness,
          falseInformationAgreement: maleBiodata.falseInformationAgreement,

          // Contact Information with Disclaimer
          contactInformation: maleBiodata.contactInformation,

          photos: [],
          privacy: {
            showContactInfo: false,
            showPhotos: true,
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log(
      `📄 Male Profile created: ${maleProfile.profileId} (Age: ${maleProfile.age}, ${maleProfile.profession})`
    );

    // Create Female Demo User and Profile
    console.log("\n📝 Creating Female Demo Profile...");
    const femalePassword = await bcrypt.hash("Demo1234", 10);

    const femaleUser = await User.findOneAndUpdate(
      { email: femaleBiodata.email },
      {
        $set: {
          name: femaleBiodata.name,
          password: femalePassword,
          profileId: femaleBiodata.profileId,
          credits: 50,
          emailVerified: true,
          authProvider: "email",
          picture: null,
        },
      },
      { upsert: true, new: true }
    );

    console.log(
      `👤 Female User created: ${femaleUser.email} (ID: ${femaleUser.profileId})`
    );

    const femaleProfile = await Profile.findOneAndUpdate(
      { userId: femaleUser._id },
      {
        $set: {
          userId: femaleUser._id,
          profileId: femaleBiodata.profileId,
          status: femaleBiodata.status,

          // Family Background
          fatherAlive: femaleBiodata.fatherAlive,
          fatherOccupation: femaleBiodata.fatherOccupation,
          motherAlive: femaleBiodata.motherAlive,
          motherOccupation: femaleBiodata.motherOccupation,
          brothersCount: femaleBiodata.brothersCount,
          brother1Occupation: femaleBiodata.brother1Occupation,
          sistersCount: femaleBiodata.sistersCount,
          sister1Occupation: femaleBiodata.sister1Occupation,
          sister2Occupation: femaleBiodata.sister2Occupation,
          unclesCount: femaleBiodata.unclesCount,
          uncle1Occupation: femaleBiodata.uncle1Occupation,
          uncle2Occupation: femaleBiodata.uncle2Occupation,
          familyEconomicCondition: femaleBiodata.familyEconomicCondition,

          // Education & Profession
          educationMedium: femaleBiodata.educationMedium,
          hscPassingYear: femaleBiodata.hscPassingYear,
          hscGroup: femaleBiodata.hscGroup,
          hscResult: femaleBiodata.hscResult,
          graduationSubject: femaleBiodata.graduationSubject,
          educationalInstitution: femaleBiodata.educationalInstitution,
          currentStudyYear: femaleBiodata.currentStudyYear,
          otherEducationalQualifications:
            femaleBiodata.otherEducationalQualifications,
          profession: femaleBiodata.profession,
          professionDescription: femaleBiodata.professionDescription,
          monthlyIncome: femaleBiodata.monthlyIncome,

          // Lifestyle, Health & Compatibility
          age: femaleBiodata.age,
          height: femaleBiodata.height,
          weight: femaleBiodata.weight,
          skinTone: femaleBiodata.skinTone,
          maritalStatus: femaleBiodata.maritalStatus,
          presentAddressDivision: femaleBiodata.presentAddressDivision,
          presentAddressDistrict: femaleBiodata.presentAddressDistrict,
          permanentAddressDivision: femaleBiodata.permanentAddressDivision,
          permanentAddressDistrict: femaleBiodata.permanentAddressDistrict,
          gender: femaleBiodata.gender,
          religiousPractices: femaleBiodata.religiousPractices,
          practiceFrequency: femaleBiodata.practiceFrequency,
          mentalPhysicalIllness: femaleBiodata.mentalPhysicalIllness,
          hobbiesLikesDislikesDreams: femaleBiodata.hobbiesLikesDislikesDreams,
          partnerStudyAfterMarriage: femaleBiodata.partnerStudyAfterMarriage,
          partnerJobAfterMarriage: femaleBiodata.partnerJobAfterMarriage,
          preferredLivingLocation: femaleBiodata.preferredLivingLocation,

          // Expected Life Partner
          partnerAgePreference: femaleBiodata.partnerAgePreference,
          partnerSkinTone: femaleBiodata.partnerSkinTone,
          partnerHeight: femaleBiodata.partnerHeight,
          partnerEducation: femaleBiodata.partnerEducation,
          partnerDistrictRegion: femaleBiodata.partnerDistrictRegion,
          partnerMaritalStatus: femaleBiodata.partnerMaritalStatus,
          partnerProfession: femaleBiodata.partnerProfession,
          partnerEconomicCondition: femaleBiodata.partnerEconomicCondition,
          specificCharacteristics: femaleBiodata.specificCharacteristics,

          // Declaration
          guardianKnowledge: femaleBiodata.guardianKnowledge,
          informationTruthfulness: femaleBiodata.informationTruthfulness,
          falseInformationAgreement: femaleBiodata.falseInformationAgreement,

          // Contact Information with Disclaimer
          contactInformation: femaleBiodata.contactInformation,

          photos: [],
          privacy: {
            showContactInfo: false,
            showPhotos: true,
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log(
      `📄 Female Profile created: ${femaleProfile.profileId} (Age: ${femaleProfile.age}, ${femaleProfile.profession})`
    );

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ DEMO BIODATA CREATION COMPLETED");
    console.log("=".repeat(60));

    console.log("\n📊 Summary:");
    console.log(`   Male Profile: ${maleProfile.profileId}`);
    console.log(`   - Name: ${maleBiodata.name}`);
    console.log(`   - Age: ${maleBiodata.age}, ${maleBiodata.profession}`);
    console.log(`   - Location: ${maleBiodata.presentAddressDistrict}`);
    console.log(`   - Email: ${maleBiodata.email}`);
    console.log(`   - Password: Demo1234`);

    console.log(`\n   Female Profile: ${femaleProfile.profileId}`);
    console.log(`   - Name: ${femaleBiodata.name}`);
    console.log(`   - Age: ${femaleBiodata.age}, ${femaleBiodata.profession}`);
    console.log(`   - Location: ${femaleBiodata.presentAddressDistrict}`);
    console.log(`   - Email: ${femaleBiodata.email}`);
    console.log(`   - Password: Demo1234`);

    console.log("\n⚠️  Note: Both profiles include a professional disclaimer");
    console.log(
      "    in the contact information section stating that these are"
    );
    console.log("    demonstration profiles and 100% anonymous.");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("\n❌ Error creating demo biodata:", error);
    process.exit(1);
  }
}

// Run the script
createDemoBiodata();
