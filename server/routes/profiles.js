const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");
const { asyncHandler } = require("../middleware/errorHandler");
const monetizationConfig = require("../config/monetization");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// Helper function to check if user can access contact information
const canAccessContactInfo = (user) => {
  // Allow if user has BRACU email domains
  if (
    user.email?.endsWith("@g.bracu.ac.bd") ||
    user.email?.endsWith("@bracu.ac.bd")
  ) {
    return true;
  }
  // Allow if user is alumni verified
  if (user.alumniVerified) {
    return true;
  }
  return false;
};

// Helper function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// @route   POST /api/profiles
// @desc    Create user profile
// @access  Private
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has BRACU email for biodata creation or is verified alumni
    if (
      !user.email.endsWith("@g.bracu.ac.bd") &&
      !user.email.endsWith("@bracu.ac.bd") &&
      !user.alumniVerified
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only BRACU students and verified alumni (@g.bracu.ac.bd or @bracu.ac.bd) can create biodata. You can still browse profiles and unlock contacts with credits.",
      });
    }

    // Check if user already has a profile
    if (user.hasProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    // Validate required fields for new profiles
    if (
      !req.body.contactInformation ||
      req.body.contactInformation.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact information is required",
      });
    }

    if (req.body.contactInformation.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Contact information must be at least 10 characters long",
      });
    }

    if (req.body.contactInformation.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Contact information cannot exceed 500 characters",
      });
    }

    // Validate personalContactInfo (required for admin use)
    if (
      !req.body.personalContactInfo ||
      req.body.personalContactInfo.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Personal contact information is required",
      });
    }

    if (req.body.personalContactInfo.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Personal contact information must be at least 5 characters long",
      });
    }

    if (req.body.personalContactInfo.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Personal contact information cannot exceed 1000 characters",
      });
    }

    // Debug: Log received data
    console.log("Creating profile for user:", user._id);
    console.log("Profile data received:", JSON.stringify(req.body, null, 2));

    // Generate profileId if not exists
    if (!user.profileId) {
      user.profileId = await User.generateProfileId();
      await user.save();
    }

    // Create new profile
    const profile = new Profile({
      userId: user._id,
      profileId: user.profileId,
      biodataId: user.profileId,
      ...req.body,
    });

    try {
      await profile.save();

      // Update user hasProfile flag
      user.hasProfile = true;
      await user.save();

      res.status(201).json({
        success: true,
        message:
          "Profile created successfully. You will receive an email notification once your profile is approved.",
        profile,
      });
    } catch (validationError) {
      // Handle validation errors specifically
      if (validationError.name === "ValidationError") {
        const formattedError = formatValidationError(validationError);
        return res.status(400).json({
          success: false,
          message: formattedError.message,
          errors: formattedError.errors,
          details: formattedError.details,
        });
      }
      // Re-throw other errors to be handled by asyncHandler
      throw validationError;
    }
  })
);

// @route   GET /api/profiles/search
// @desc    Search profiles with filters
// @access  Public (only approved profiles)
router.get("/search", async (req, res) => {
  try {
    // Check if user is authenticated and restricted
    let currentUser = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.userId).select(
          "isRestricted"
        );
      } catch (error) {
        // Invalid token, treat as unauthenticated
      }
    }

    // If user is restricted, return empty results
    if (currentUser && currentUser.isRestricted) {
      return res.json({
        success: true,
        profiles: [],
        pagination: {
          current: parseInt(req.query.page) || 1,
          pages: 0,
          total: 0,
        },
      });
    }
    const {
      search,
      gender,
      minAge,
      maxAge,
      education,
      profession,
      district,
      religion,
      page = 1,
      limit = 10,
    } = req.query;

    // Build search filters with exact matches where possible
    const filters = { status: "approved" };

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filters.$or = [
        { name: searchRegex },
        { educationLevel: searchRegex },
        { profession: searchRegex },
        { presentAddressDistrict: searchRegex },
        { permanentAddressDistrict: searchRegex },
        { sscGroup: searchRegex },
        { bracu_department: searchRegex },
      ];
    }

    if (gender) filters.gender = gender;
    if (minAge || maxAge) {
      filters.age = {};
      if (minAge) filters.age.$gte = parseInt(minAge);
      if (maxAge) filters.age.$lte = parseInt(maxAge);
    }
    if (religion) filters.religion = religion;
    // Use case-insensitive exact matches instead of regex where possible
    if (education) {
      filters.educationLevel = { $regex: new RegExp(`^${education}`, "i") };
    }
    if (profession) {
      filters.profession = { $regex: new RegExp(`^${profession}`, "i") };
    }
    if (district && district !== "Any" && district !== "") {
      // If search is already using $or, combine with $and
      if (filters.$or) {
        filters.$and = [
          { $or: filters.$or },
          {
            $or: [
              { presentAddressDistrict: { $regex: new RegExp(district, "i") } },
              {
                permanentAddressDistrict: { $regex: new RegExp(district, "i") },
              },
            ],
          },
        ];
        delete filters.$or;
      } else {
        // Search in present and permanent address district fields
        filters.$or = [
          { presentAddressDistrict: { $regex: new RegExp(district, "i") } },
          { permanentAddressDistrict: { $regex: new RegExp(district, "i") } },
        ];
      }
    }

    // Fetch all matching profiles, excluding those from restricted users
    const allProfiles = await Profile.find(filters)
      .populate({
        path: "userId",
        select: "isRestricted",
        match: { isRestricted: { $ne: true } }, // Exclude profiles where user is restricted
      })
      .select("-privacy -contactInformation -personalContactInfo -__v")
      .lean();

    // Filter out profiles where userId is null (due to populate match)
    const filteredProfiles = allProfiles.filter(
      (profile) => profile.userId !== null
    );

    // Shuffle the entire result set to ensure all profiles get equal traffic
    shuffleArray(filteredProfiles);

    // Calculate total and pagination
    const total = filteredProfiles.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const profiles = filteredProfiles.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      profiles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Search profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search profiles",
    });
  }
});

// @route   GET /api/profiles/stats
// @desc    Get biodata statistics
// @access  Public
router.get("/stats", async (req, res) => {
  try {
    const stats = await Profile.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const male = stats.find((stat) => stat._id === "Male")?.count || 0;
    const female = stats.find((stat) => stat._id === "Female")?.count || 0;

    res.json({
      success: true,
      data: {
        total,
        male,
        female,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// @route   GET /api/profiles/my-unlocks
// @desc    Get all profiles that the current user has unlocked
// @access  Private
router.get(
  "/my-unlocks",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get the user with unlocked contacts
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user can access contact information (BRACU email or alumni verified)
    if (!canAccessContactInfo(user)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only BRACU students and verified alumni can view unlocked profiles.",
      });
    }

    // If no unlocked contacts, return empty array
    if (!user.unlockedContacts || user.unlockedContacts.length === 0) {
      return res.json({
        success: true,
        profiles: [],
        message: "No unlocked profiles found",
      });
    }

    // Get all unlocked profiles
    const profiles = await Profile.find({
      profileId: { $in: user.unlockedContacts },
      status: "approved",
    })
      .populate("userId", "name")
      .select("profileId biodataId age location contactInformation createdAt")
      .lean();

    // Ensure biodataId is set for profiles that don't have it (backwards compatibility)
    const profilesWithBiodataId = profiles.map((profile) => ({
      ...profile,
      biodataId: profile.biodataId || profile.profileId,
    }));

    // Add unlock timestamp for each profile (simplified approach)
    const profilesWithUnlockTime = profilesWithBiodataId.map((profile) => ({
      ...profile,
      unlockedAt: new Date(), // Use current date as unlock time
    }));

    res.json({
      success: true,
      profiles: profilesWithUnlockTime,
    });
  })
);

// @route   GET /api/profiles/:profileId
// @desc    Get single profile
// @access  Public for approved profiles, Private for additional features
router.get("/:profileId", async (req, res) => {
  try {
    // Check if user is authenticated (optional)
    let currentUser = null;
    try {
      const token =
        req.cookies?.token ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await require("../models/User")
          .findById(decoded.userId)
          .select("name email profileId isActive role credits isRestricted")
          .lean();
      }
    } catch (authError) {
      // Authentication failed, but that's okay - continue as public user
      console.log(
        "Profile view: User not authenticated, treating as public view"
      );
    }

    // PERFORMANCE: Use .lean() for faster queries since we don't need Mongoose document methods
    const profile = await Profile.findOne({
      profileId: req.params.profileId,
      status: "approved",
    })
      .populate("userId", "name email isRestricted")
      .select("-__v"); // Exclude version key

    if (!profile) {
      // Check if profile exists but is pending
      const pendingProfile = await Profile.findOne({
        profileId: req.params.profileId,
        status: "pending_approval",
      })
        .select("status")
        .lean();

      if (pendingProfile) {
        return res.status(404).json({
          success: false,
          message:
            "This biodata is currently under review and not available for viewing.",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Check if profile is hidden or user is restricted
    if (profile.status === "hidden" || profile.userId?.isRestricted) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Check if current user is restricted
    if (currentUser && currentUser.isRestricted) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Simplified view tracking - only increment if authenticated and not owner
    if (
      currentUser &&
      profile.userId._id.toString() !== currentUser._id.toString()
    ) {
      // Fire and forget - don't wait for the update
      Profile.findByIdAndUpdate(profile._id, { $inc: { viewCount: 1 } })
        .exec()
        .catch((err) => console.log("View count update failed:", err));
    }

    // Filter sensitive information based on user permissions and privacy settings
    const profileResponse = profile.toObject();
    const isOwner =
      currentUser &&
      currentUser._id.toString() === profile.userId._id.toString();
    const isAdmin = currentUser && currentUser.role === "admin";
    const canAccessContact =
      isOwner ||
      isAdmin ||
      (profile.privacy?.showContactInfo && canAccessContactInfo(currentUser));

    // personalContactInfo is for owner and admin use only
    if (!isOwner && !isAdmin) {
      delete profileResponse.personalContactInfo;
    }

    // contactInformation is shown to owner and admin, or after unlocking via separate endpoint
    if (!isOwner && !isAdmin) {
      delete profileResponse.contactInformation;
    }

    // userId name and email: show to owner and admin only
    if (!isOwner && !isAdmin) {
      delete profileResponse.userId.name;
      delete profileResponse.userId.email;
    }

    // Delete any name or email fields that might exist on the profile itself (defense in depth)
    if (!isOwner && !isAdmin) {
      delete profileResponse.name;
      delete profileResponse.email;
    }

    res.json({
      success: true,
      profile: profileResponse,
      isAuthenticated: !!currentUser,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
});

// @route   GET /api/profiles/user/me
// @desc    Get current user's profile
// @access  Private
router.get("/user/me", auth, async (req, res) => {
  try {
    // PERFORMANCE: Use .lean() for faster queries
    const profile = await Profile.findOne({ userId: req.user.id })
      .populate("userId", "name email picture")
      .select("-__v")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
});

// @route   PUT /api/profiles/user/me
// @desc    Update current user's profile
// @access  Private
router.put(
  "/user/me",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Validate contactInformation if it's being updated
    if (req.body.contactInformation !== undefined) {
      if (
        !req.body.contactInformation ||
        req.body.contactInformation.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Contact information is required",
        });
      }

      if (req.body.contactInformation.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Contact information must be at least 10 characters long",
        });
      }

      if (req.body.contactInformation.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Contact information cannot exceed 500 characters",
        });
      }
    }

    // Validate personalContactInfo if it's being updated (required for admin use)
    if (req.body.personalContactInfo !== undefined) {
      if (
        !req.body.personalContactInfo ||
        req.body.personalContactInfo.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Personal contact information is required",
        });
      }

      if (req.body.personalContactInfo.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message:
            "Personal contact information must be at least 5 characters long",
        });
      }

      if (req.body.personalContactInfo.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Personal contact information cannot exceed 1000 characters",
        });
      }
    }

    // Check if this is an edit (profile already exists and has been edited before)
    const isEdit = profile.editCount > 0 || profile.status === "approved";
    const wasApproved = profile.status === "approved";

    // Track which fields are being changed
    const changedFields = [];
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        // Check if the value is actually different from current value
        const currentValue = profile[key];
        const newValue = req.body[key];

        // Compare values (handle different data types)
        if (currentValue !== newValue) {
          changedFields.push(key);
        }

        profile[key] = newValue;
      }
    });

    // If this is an edit to an existing profile, trigger admin review
    if (isEdit) {
      profile.status = "pending_approval";
      profile.isUnderReview = true;
      profile.hasEditPending = true;
      profile.rejectionReason = null; // Clear any previous rejection reason

      // Add changed fields to the editedFields array (avoid duplicates)
      changedFields.forEach((field) => {
        if (!profile.editedFields.includes(field)) {
          profile.editedFields.push(field);
        }
      });
    }

    // Update edit tracking fields
    profile.lastEditDate = new Date();
    profile.editCount = (profile.editCount || 0) + 1;

    await profile.save();

    const message =
      isEdit && wasApproved
        ? "Profile updated successfully! Your changes are now under admin review. You will receive an email notification once approved."
        : "Profile updated successfully!";

    res.json({
      success: true,
      message,
      profile,
      requiresReview: isEdit && wasApproved,
    });
  })
);

// @route   DELETE /api/profiles/user/me
// @desc    Delete current user's profile
// @access  Private
router.delete(
  "/user/me",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Delete the profile
    await Profile.findByIdAndDelete(profile._id);

    // Update user hasProfile flag
    const user = await User.findById(req.user.id);
    if (user) {
      user.hasProfile = false;
      await user.save();
    }

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);

// @route   POST /api/profiles/:profileId/unlock-contact
// @desc    Unlock contact information of a profile
// @access  Private
router.post(
  "/:profileId/unlock-contact",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    // Get the requesting user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the profile to unlock
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    }).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    // Check if user is the owner or admin
    const isOwner = profile.userId._id.toString() === userId;
    const isAdmin = user.role === "admin";

    // For owner, return contact information directly
    if (isOwner) {
      return res.json({
        success: true,
        message: "Contact information accessed",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    // For admin, return contact information
    if (isAdmin) {
      return res.json({
        success: true,
        message: "Contact information accessed by admin",
        contactInfo:
          profile.contactInformation ||
          "No contact information provided by the user.",
        remainingCredits: user.credits,
      });
    }

    // For non-owner/admin users, check if they can unlock with credits
    const canUnlock = canAccessContactInfo(user);
    if (!canUnlock) {
      return res.status(403).json({
        success: false,
        message:
          "Contact information is restricted to BRACU students and verified alumni only.",
      });
    }

    // Check if monetization is enabled
    if (!monetizationConfig.shouldRequireCreditsForContact()) {
      // Free access mode - return contact info directly
      return res.json({
        success: true,
        message: "Contact information accessed (free mode)",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    // Check if user has already unlocked this contact
    if (user.unlockedContacts && user.unlockedContacts.includes(profileId)) {
      return res.json({
        success: true,
        message: "Contact already unlocked",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    // Check if user has enough credits (1 credit required)
    const unlockCost = 1;
    if (user.credits < unlockCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${unlockCost} credit(s) to unlock contact information.`,
      });
    }

    // Deduct credits and add to unlocked contacts
    user.credits -= unlockCost;
    if (!user.unlockedContacts) {
      user.unlockedContacts = [];
    }
    user.unlockedContacts.push(profileId);
    await user.save();

    // Record the transaction
    if (monetizationConfig.shouldRecordTransactions()) {
      const Transaction = require("../models/Transaction");
      await Transaction.create({
        user: user._id,
        type: "contact_unlock",
        amount: unlockCost,
        credits: -unlockCost,
        description: `Unlocked contact for profile ${profileId}`,
      });
    }

    return res.json({
      success: true,
      message: "Contact information unlocked successfully",
      contactInfo:
        profile.contactInformation || "No contact information provided.",
      remainingCredits: user.credits,
    });
  })
);
// @desc    Check if contact information is already unlocked for a profile
// @access  Private
router.get(
  "/:profileId/contact-status",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    // Find the profile (user data available from auth middleware)
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    })
      .populate("userId", "name")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    // Check if user is the owner or admin
    const isOwner = profile.userId._id.toString() === userId;
    const isAdmin = req.user.role === "admin";

    // For owner, always return as unlocked
    if (isOwner) {
      return res.json({
        success: true,
        isUnlocked: true,
        isOwnProfile: true,
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: req.user.credits,
      });
    }

    // For admin, return contact information
    if (isAdmin) {
      return res.json({
        success: true,
        isUnlocked: true,
        contactInfo:
          profile.contactInformation ||
          "No contact information provided by the user.",
        remainingCredits: req.user.credits,
      });
    }

    // Check if user has already unlocked this contact
    const user = await User.findById(userId);
    const isAlreadyUnlocked =
      user.unlockedContacts && user.unlockedContacts.includes(profileId);

    if (isAlreadyUnlocked) {
      return res.json({
        success: true,
        isUnlocked: true,
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    // Check if user can unlock this contact (verified alumni or BRACU email)
    const canUnlock = canAccessContactInfo(user);
    if (!canUnlock) {
      return res.status(403).json({
        success: false,
        message:
          "Contact information is restricted to BRACU students and verified alumni only.",
        isUnlocked: false,
        canUnlock: false,
      });
    }

    // User can unlock but hasn't yet
    return res.json({
      success: true,
      isUnlocked: false,
      canUnlock: true,
      remainingCredits: user.credits,
    });
  })
);

// @route   DELETE /api/profiles
// @desc    Delete user profile
// @access  Private
router.delete(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find and delete the user's profile
    const profile = await Profile.findOneAndDelete({ userId: user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Update user's hasProfile status
    user.hasProfile = false;
    await user.save();

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);

// @route   POST /api/profiles/request-verification
// @desc    Request alumni verification
// @access  Private
router.post(
  "/request-verification",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user already has BRACU email
    if (
      user.email.endsWith("@g.bracu.ac.bd") ||
      user.email.endsWith("@bracu.ac.bd")
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have a BRACU email address.",
      });
    }

    // Check if already verified
    if (user.alumniVerified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified as an alumni.",
      });
    }

    // Check if request already pending
    if (user.verificationRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Verification request already submitted. Please wait for admin approval.",
      });
    }

    // Set verification request flag
    user.verificationRequest = true;
    await user.save();

    res.json({
      success: true,
      message:
        "Verification request submitted successfully. Please send your proof to our Facebook page.",
    });
  })
);

module.exports = router;
