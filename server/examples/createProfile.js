require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Draft = require("../models/Draft");

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://aditto:none@matrimonycluster.pafedm3.mongodb.net/bracu_matrimony?retryWrites=true&w=majority";

// Complete biodata data for testing
const testPersonalBiodata = {
  // User Info
  email: "tasneem.bin.mahmood@g.bracu.ac.bd",
  name: "Tasneem Bin Mahmood",
  profileId: "BRACU9999",
  gender: "Female",

  // Family Background
  fatherAlive: "Yes",
  fatherOccupation:
    "Professor at BRAC University, Department of Computer Science and Engineering",
  motherAlive: "Yes",
  motherOccupation:
    "Associate Professor at BRAC University, Department of Mathematics and Natural Sciences",
  brothersCount: 1,
  brother1Occupation:
    "Software Engineer at a leading tech company in Silicon Valley",
  sistersCount: 0,
  unclesCount: 2,
  uncle1Occupation: "Retired Government Officer, former Deputy Secretary",
  uncle2Occupation: "Business Owner - Real Estate Development",
  familyEconomicCondition: "Upper-middle",
  familyType: "Nuclear",
  familyValues: "Moderate",

  // Education & Profession
  educationMedium: "English",
  hscPassingYear: 2019,
  hscGroup: "Science",
  hscResult: "GPA 5.00 (Golden A+)",
  intermediatePassingYear: 2017,
  intermediateGroup: "Science",
  intermediateResult: "GPA 5.00 (Golden A+)",
  graduationSubject: "Computer Science and Engineering",
  educationalInstitution:
    "BRAC University (BSc in CSE with CGPA 3.95 out of 4.00)",
  currentStudyYear: "Completed",
  otherEducationalQualifications:
    "Minor in Data Science, Certificate in Machine Learning from Coursera",
  profession: "Software Engineer",
  professionDescription:
    "Working as a Software Engineer at a multinational tech company in Dhaka. Specializing in full-stack web development, cloud computing, and AI/ML applications. Leading frontend development projects and mentoring junior developers.",
  monthlyIncome: "60,000 - 80,000 BDT",

  // Lifestyle, Health & Compatibility
  age: 23,
  height: "5'4\"",
  weight: "55 kg",
  skinTone: "Fair",
  maritalStatus: "Never Married",
  presentAddressDivision: "Dhaka",
  presentAddressDistrict: "Dhaka",
  permanentAddressDivision: "Dhaka",
  permanentAddressDistrict: "Dhaka",
  religion: "Muslim",
  religiousPractices:
    "Alhamdulillah, I maintain regular prayers (5 times Salah daily), observe fasting during Ramadan, and actively participate in Islamic study circles. I strive to follow the Sunnah in daily life and seek to continuously improve my understanding of the Deen.",
  practiceFrequency: "Daily",
  mentalPhysicalIllness:
    "Alhamdulillah, in excellent health with no physical or mental health concerns. Maintain regular exercise routine including yoga and walking, and have annual health check-ups.",
  hobbiesLikesDislikesDreams:
    "Passionate about technology, coding, reading Islamic literature, and contemporary books. Enjoy playing badminton, traveling to Islamic historical sites, photography, and contributing to open-source projects. Dream of establishing a tech education initiative for underprivileged girls while maintaining strong family values and Islamic principles.",
  partnerStudyAfterMarriage: "Strongly Support",
  partnerJobAfterMarriage: "Strongly Support",
  preferredLivingLocation: "Dhaka",

  // Expected Life Partner
  partnerAgePreference: "24-28 years",
  partnerAgePreferenceMin: 24,
  partnerAgePreferenceMax: 28,
  partnerSkinTone: "Any",
  partnerHeight: "5'6\" - 6'0\"",
  partnerHeightMin: "5'6\"",
  partnerHeightMax: "6'0\"",
  partnerEducation:
    "Minimum Bachelor's degree, preferably in Engineering, Computer Science, or related technical field",
  partnerDistrictRegion: "Dhaka or nearby areas",
  partnerMaritalStatus: "Single",
  partnerProfession: "Professional in tech, engineering, or business field",
  partnerEconomicCondition: "Middle",
  specificCharacteristics:
    "Seeking a life partner who is practicing Muslim with strong Islamic values, good character, and professional ambition. Should be respectful, family-oriented, and have good communication skills. Someone who understands the importance of both career growth and family life. Mutual respect, understanding, shared Islamic values, and complementary personalities are essential.",

  // Declaration
  guardianKnowledge: "Yes",
  informationTruthfulness: "Yes",
  falseInformationAgreement: "Yes",

  // Contact Information (optional)
  contactInformation:
    "Email: tasneem.bin.mahmood@g.bracu.ac.bd | Phone: +880 1XX XXX XXXX | Available for contact through BRACU Matrimony platform",

  // Status (for draft, this will be set when submitted)
  status: "pending_approval",
};

async function createTestPersonalProfile() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if user exists, if not create one
    let user = await User.findOne({ email: testPersonalBiodata.email });

    if (!user) {
      const hashedPassword = await bcrypt.hash("Test1234", 10);
      user = new User({
        name: testPersonalBiodata.name,
        email: testPersonalBiodata.email,
        password: hashedPassword,
        profileId: testPersonalBiodata.profileId,
        credits: 10,
        emailVerified: true,
        authProvider: "email",
      });
      await user.save();
      console.log(
        `👤 Created user: ${user.email} (profileId: ${user.profileId})`
      );
    } else {
      console.log(
        `👤 User already exists: ${user.email} (profileId: ${user.profileId})`
      );
    }

    // Create or update draft with complete biodata data
    const draftData = {
      // Segment 1: Family Background
      fatherAlive: testPersonalBiodata.fatherAlive,
      fatherOccupation: testPersonalBiodata.fatherOccupation,
      motherAlive: testPersonalBiodata.motherAlive,
      motherOccupation: testPersonalBiodata.motherOccupation,
      brothersCount: testPersonalBiodata.brothersCount,
      ...(testPersonalBiodata.brother1Occupation && {
        brother1Occupation: testPersonalBiodata.brother1Occupation,
      }),
      sistersCount: testPersonalBiodata.sistersCount,
      unclesCount: testPersonalBiodata.unclesCount,
      ...(testPersonalBiodata.uncle1Occupation && {
        uncle1Occupation: testPersonalBiodata.uncle1Occupation,
      }),
      ...(testPersonalBiodata.uncle2Occupation && {
        uncle2Occupation: testPersonalBiodata.uncle2Occupation,
      }),
      familyEconomicCondition: testPersonalBiodata.familyEconomicCondition,
      familyType: testPersonalBiodata.familyType,
      familyValues: testPersonalBiodata.familyValues,

      // Segment 2: Education & Profession
      educationMedium: testPersonalBiodata.educationMedium,
      hscPassingYear: testPersonalBiodata.hscPassingYear,
      hscGroup: testPersonalBiodata.hscGroup,
      hscResult: testPersonalBiodata.hscResult,
      intermediatePassingYear: testPersonalBiodata.intermediatePassingYear,
      intermediateGroup: testPersonalBiodata.intermediateGroup,
      intermediateResult: testPersonalBiodata.intermediateResult,
      graduationSubject: testPersonalBiodata.graduationSubject,
      educationalInstitution: testPersonalBiodata.educationalInstitution,
      currentStudyYear: testPersonalBiodata.currentStudyYear,
      otherEducationalQualifications:
        testPersonalBiodata.otherEducationalQualifications,
      profession: testPersonalBiodata.profession,
      professionDescription: testPersonalBiodata.professionDescription,
      monthlyIncome: testPersonalBiodata.monthlyIncome,

      // Segment 3: Lifestyle, Health & Compatibility
      age: testPersonalBiodata.age,
      height: testPersonalBiodata.height,
      weight: testPersonalBiodata.weight,
      skinTone: testPersonalBiodata.skinTone,
      maritalStatus: testPersonalBiodata.maritalStatus,
      presentAddressDivision: testPersonalBiodata.presentAddressDivision,
      presentAddressDistrict: testPersonalBiodata.presentAddressDistrict,
      permanentAddressDivision: testPersonalBiodata.permanentAddressDivision,
      permanentAddressDistrict: testPersonalBiodata.permanentAddressDistrict,
      gender: testPersonalBiodata.gender,
      religiousPractices: testPersonalBiodata.religiousPractices,
      practiceFrequency: testPersonalBiodata.practiceFrequency,
      mentalPhysicalIllness: testPersonalBiodata.mentalPhysicalIllness,
      hobbiesLikesDislikesDreams:
        testPersonalBiodata.hobbiesLikesDislikesDreams,
      partnerStudyAfterMarriage: testPersonalBiodata.partnerStudyAfterMarriage,
      partnerJobAfterMarriage: testPersonalBiodata.partnerJobAfterMarriage,
      preferredLivingLocation: testPersonalBiodata.preferredLivingLocation,

      // Segment 4: Expected Life Partner & Declaration
      partnerAgePreference: testPersonalBiodata.partnerAgePreference,
      partnerSkinTone: testPersonalBiodata.partnerSkinTone,
      partnerHeight: testPersonalBiodata.partnerHeight,
      partnerEducation: testPersonalBiodata.partnerEducation,
      partnerDistrictRegion: testPersonalBiodata.partnerDistrictRegion,
      partnerMaritalStatus: testPersonalBiodata.partnerMaritalStatus,
      partnerProfession: testPersonalBiodata.partnerProfession,
      partnerEconomicCondition: testPersonalBiodata.partnerEconomicCondition,
      specificCharacteristics: testPersonalBiodata.specificCharacteristics,
      guardianKnowledge: testPersonalBiodata.guardianKnowledge,
      informationTruthfulness: testPersonalBiodata.informationTruthfulness,
      falseInformationAgreement: testPersonalBiodata.falseInformationAgreement,

      // Contact Information
      contactInformation: testPersonalBiodata.contactInformation,
    };

    // Create or update the draft
    const draft = await Draft.findOneAndUpdate(
      { userId: user._id },
      {
        currentStep: 4, // Complete all steps
        draftData: draftData,
        lastModified: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`📝 Created/Updated draft for user: ${user.email}`);
    console.log(`📝 Draft ID: ${draft._id}`);
    console.log(`📝 Current Step: ${draft.currentStep}`);
    console.log(`📝 Draft Data Keys: ${Object.keys(draft.draftData).length}`);

    console.log("\n✅ Test personal profile draft created successfully!");
    console.log(
      "🎯 You can now test the biodata creation flow without filling forms manually."
    );
    console.log(
      "💡 The draft contains all required fields and is ready for submission."
    );
  } catch (error) {
    console.error("❌ Error creating test personal profile:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
createTestPersonalProfile();
