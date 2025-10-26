const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    // Link to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileId: {
      type: String,
      required: true,
      unique: true,
    },
    biodataId: {
      type: String,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ["pending_approval", "approved", "rejected", "hidden"],
        message:
          "Status must be one of: pending_approval, approved, rejected, hidden",
      },
      default: "pending_approval",
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // Edit tracking fields
    isUnderReview: {
      type: Boolean,
      default: false,
    },
    hasEditPending: {
      type: Boolean,
      default: false,
    },
    lastEditDate: {
      type: Date,
      default: null,
    },
    editCount: {
      type: Number,
      default: 0,
    },
    editedFields: {
      type: [String],
      default: [],
    },

    // Segment 1: Family Background
    fatherAlive: {
      type: String,
      enum: {
        values: ["Yes", "No"],
        message: "Father alive status must be either Yes or No",
      },
      required: [true, "Father's status is required"],
    },
    fatherOccupation: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          // Required only if father is alive
          return (
            this.fatherAlive === "No" ||
            (this.fatherAlive === "Yes" && value && value.trim().length > 0)
          );
        },
        message:
          "Father's occupation details are required when father is alive",
      },
    },
    motherAlive: {
      type: String,
      enum: {
        values: ["Yes", "No"],
        message: "Mother alive status must be either Yes or No",
      },
      required: [true, "Mother's status is required"],
    },
    motherOccupation: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          // Required only if mother is alive
          return (
            this.motherAlive === "No" ||
            (this.motherAlive === "Yes" && value && value.trim().length > 0)
          );
        },
        message:
          "Mother's occupation details are required when mother is alive",
      },
    },
    brothersCount: {
      type: Number,
      required: [true, "Number of brothers is required"],
      min: [0, "Number of brothers cannot be negative"],
    },
    // Dynamic brother occupations - will be saved as brotherXOccupation fields
    sistersCount: {
      type: Number,
      required: [true, "Number of sisters is required"],
      min: [0, "Number of sisters cannot be negative"],
    },
    // Dynamic sister occupations - will be saved as sisterXOccupation fields
    unclesCount: {
      type: Number,
      min: [0, "Number of uncles cannot be negative"],
      default: 0,
    },
    // Dynamic uncle occupations - will be saved as uncleXOccupation fields
    familyEconomicCondition: {
      type: String,
      enum: {
        values: ["Lower", "Middle", "Upper-middle", "Affluent"],
        message:
          "Family economic condition must be one of: Lower, Middle, Upper-middle, Affluent",
      },
      required: [true, "Family economic condition is required"],
    },

    // Segment 2: Education & Profession
    educationMedium: {
      type: String,
      enum: {
        values: ["Bengali", "English", "Both"],
        message: "Education medium must be one of: Bengali, English, Both",
      },
      required: [true, "Education medium is required"],
    },
    hscPassingYear: {
      type: Number,
      required: [true, "HSC passing year is required"],
      min: [1990, "HSC passing year must be after 1990"],
      max: [2035, "HSC passing year cannot be after 2035"],
    },
    hscGroup: {
      type: String,
      required: [true, "HSC group is required"],
      trim: true,
    },
    hscResult: {
      type: String,
      required: [true, "HSC result is required"],
      trim: true,
    },
    intermediatePassingYear: {
      type: Number,
      min: [1990, "Intermediate passing year must be after 1990"],
      max: [2030, "Intermediate passing year cannot be after 2030"],
    },
    intermediateGroup: {
      type: String,
      trim: true,
    },
    intermediateResult: {
      type: String,
      trim: true,
    },
    graduationSubject: {
      type: String,
      trim: true,
    },
    educationalInstitution: {
      type: String,
      trim: true,
    },
    currentStudyYear: {
      type: String,
      trim: true,
    },
    otherEducationalQualifications: {
      type: String,
      trim: true,
    },
    profession: {
      type: String,
      required: [true, "Profession is required"],
      trim: true,
    },
    professionDescription: {
      type: String,
      required: [true, "Profession description is required"],
      trim: true,
    },
    monthlyIncome: {
      type: String,
      enum: {
        values: [
          "No Income",
          "Below 20,000 BDT",
          "20,000 - 40,000 BDT",
          "40,000 - 60,000 BDT",
          "60,000 - 80,000 BDT",
          "80,000 - 100,000 BDT",
          "Above 100,000 BDT",
          "Prefer not to say",
        ],
        message: "Invalid income range selected",
      },
      required: [true, "Monthly income is required"],
    },

    // Segment 3: Lifestyle, Health & Compatibility
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Age must be at least 18"],
      max: [100, "Age must be less than 100"],
    },
    height: {
      type: String,
      required: [true, "Height is required"],
    },
    weight: {
      type: String,
      required: [true, "Weight is required"],
    },
    skinTone: {
      type: String,
      enum: {
        values: ["Fair", "Medium", "Dark", "Very Fair", "Wheatish"],
        message:
          "Skin tone must be one of: Fair, Medium, Dark, Very Fair, Wheatish",
      },
      required: [true, "Skin tone is required"],
    },
    maritalStatus: {
      type: String,
      enum: {
        values: ["Never Married", "Divorced", "Widowed"],
        message:
          "Marital status must be one of: Never Married, Divorced, Widowed",
      },
      required: [true, "Marital status is required"],
    },
    presentAddressDivision: {
      type: String,
      required: [true, "Present address division is required"],
      trim: true,
    },
    presentAddressDistrict: {
      type: String,
      required: [true, "Present address district is required"],
      trim: true,
    },
    permanentAddressDivision: {
      type: String,
      required: [true, "Permanent address division is required"],
      trim: true,
    },
    permanentAddressDistrict: {
      type: String,
      required: [true, "Permanent address district is required"],
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female"],
        message: "Gender must be either Male or Female",
      },
      required: [true, "Gender is required"],
    },
    religion: {
      type: String,
      enum: {
        values: ["Muslim", "Hindu", "Christian", "Buddhist", "Other"],
        message:
          "Religion must be one of: Muslim, Hindu, Christian, Buddhist, Other",
      },
      required: [true, "Religion is required"],
      trim: true,
    },
    religiousPractices: {
      type: String,
      required: [true, "Religious practices information is required"],
      trim: true,
    },
    practiceFrequency: {
      type: String,
      enum: {
        values: ["Daily", "Weekly", "Monthly", "Occasionally", "Rarely"],
        message:
          "Practice frequency must be one of: Daily, Weekly, Monthly, Occasionally, Rarely",
      },
      required: [true, "Practice frequency is required"],
    },
    mentalPhysicalIllness: {
      type: String,
      required: [true, "Health information is required"],
      trim: true,
    },
    hobbiesLikesDislikesDreams: {
      type: String,
      required: [
        true,
        "Hobbies, likes, dislikes, and dreams information is required",
      ],
      trim: true,
    },
    partnerStudyAfterMarriage: {
      type: String,
      enum: {
        values: [
          "", // Allow empty string
          "Strongly Support",
          "Support",
          "Neutral",
          "Don't Support",
          "Strongly Against",
        ],
        message: "Invalid partner study view selected",
      },
    },
    partnerJobAfterMarriage: {
      type: String,
      enum: {
        values: [
          "", // Allow empty string
          "Strongly Support",
          "Support",
          "Neutral",
          "Don't Support",
          "Strongly Against",
        ],
        message: "Invalid partner job view selected",
      },
    },
    preferredLivingLocation: {
      type: String,
      trim: true,
    },

    // Segment 4: Expected Life Partner & Declaration
    partnerAgePreference: {
      type: String,
      required: [true, "Partner age preference is required"],
      trim: true,
    },
    partnerSkinTone: {
      type: String,
      enum: {
        values: ["Fair", "Medium", "Dark", "Any"],
        message:
          "Partner skin tone preference must be one of: Fair, Medium, Dark, Any",
      },
      required: [true, "Partner skin tone preference is required"],
    },
    partnerHeight: {
      type: String,
      required: [true, "Partner height preference is required"],
      trim: true,
    },
    partnerEducation: {
      type: String,
      required: [true, "Partner education preference is required"],
      trim: true,
    },
    partnerDistrictRegion: {
      type: String,
      required: [true, "Partner district/region preference is required"],
      trim: true,
    },
    partnerMaritalStatus: {
      type: String,
      enum: {
        values: ["Single", "Divorced", "Widowed", "Any"],
        message:
          "Partner marital status preference must be one of: Single, Divorced, Widowed, Any",
      },
      required: [true, "Partner marital status preference is required"],
    },
    partnerProfession: {
      type: String,
      required: [true, "Partner profession preference is required"],
      trim: true,
    },
    partnerEconomicCondition: {
      type: String,
      enum: {
        values: ["Lower", "Middle", "Upper-middle", "Affluent", "Any"],
        message:
          "Partner economic condition preference must be one of: Lower, Middle, Upper-middle, Affluent, Any",
      },
      required: [true, "Partner economic condition preference is required"],
    },
    specificCharacteristics: {
      type: String,
      trim: true,
    },
    guardianKnowledge: {
      type: String,
      enum: {
        values: ["Yes", "No"],
        message: "Guardian knowledge must be either Yes or No",
      },
      required: [true, "Guardian knowledge confirmation is required"],
    },
    informationTruthfulness: {
      type: String,
      enum: {
        values: ["Yes", "No"],
        message:
          "Information truthfulness confirmation must be either Yes or No",
      },
      required: [true, "Information truthfulness confirmation is required"],
    },
    falseInformationAgreement: {
      type: String,
      enum: {
        values: ["Yes", "No"],
        message: "False information agreement must be either Yes or No",
      },
      required: [true, "False information agreement is required"],
    },

    // Contact Information
    contactInformation: {
      type: String,
      required: false, // Made optional to handle existing profiles
      default: "", // Default empty string for existing profiles
      trim: true,
      validate: {
        validator: function (value) {
          // Only validate if value is provided
          if (!value || value.trim() === "") return true; // Allow empty
          return value.trim().length >= 10 && value.trim().length <= 500;
        },
        message:
          "Contact information must be between 10-500 characters when provided",
      },
    },

    // Photos
    photos: [
      {
        url: String,
        isProfile: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Privacy Settings
    privacy: {
      showContactInfo: {
        type: Boolean,
        default: false,
      },
      showPhotos: {
        type: Boolean,
        default: true,
      },
    },

    // Metadata
    viewCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow dynamic fields like brother1Occupation, brother2Occupation, etc.
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance (only for fields that don't have unique: true)
// Note: profileId already has unique: true, so no need for separate index
profileSchema.index({ userId: 1 });
profileSchema.index({ status: 1 });
profileSchema.index({ familyEconomicCondition: 1, status: 1 });
profileSchema.index({ partnerEconomicCondition: 1, status: 1 });
// PERFORMANCE: Compound index for the most common query pattern
profileSchema.index({ profileId: 1, status: 1 });

// Pre-save middleware to update lastUpdated and ensure biodataId
profileSchema.pre("save", function (next) {
  if (!this.biodataId && this.profileId) {
    this.biodataId = this.profileId;
  }
  this.lastUpdated = new Date();
  next();
});

// Method to increment view count
profileSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save();
};

// Pre-save middleware to handle empty strings for optional enum fields
profileSchema.pre("save", function (next) {
  // List of optional enum fields that should not have empty strings
  const optionalEnumFields = [
    "partnerStudyAfterMarriage",
    "partnerJobAfterMarriage",
  ];

  // Convert empty strings to undefined for optional enum fields
  optionalEnumFields.forEach((field) => {
    if (
      this[field] === "" ||
      (typeof this[field] === "string" && this[field].trim() === "")
    ) {
      this[field] = undefined;
    }
  });

  next();
});

// Static method to get approved profiles with filters
profileSchema.statics.getApprovedProfiles = function (filters = {}) {
  const query = { status: "approved", ...filters };
  return this.find(query).populate("userId", "name email picture");
};

// Additional indexes for better query performance
// Note: status and userId already indexed above, profileId has unique: true
profileSchema.index({ gender: 1 });
profileSchema.index({ age: 1 });
profileSchema.index({ educationLevel: 1 });
profileSchema.index({ profession: 1 });
profileSchema.index({ createdAt: -1 });
// District indexes for faster location-based searches
profileSchema.index({ presentAddressDistrict: 1 });
profileSchema.index({ permanentAddressDistrict: 1 });
// Compound indexes for common search queries
profileSchema.index({ status: 1, gender: 1, age: 1 });
profileSchema.index({ status: 1, createdAt: -1 });
// Compound indexes for district searches with status
profileSchema.index({ status: 1, presentAddressDistrict: 1 });
profileSchema.index({ status: 1, permanentAddressDistrict: 1 });

module.exports = mongoose.model("Profile", profileSchema);
