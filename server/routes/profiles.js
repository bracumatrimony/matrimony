const express = require("express");
const Profile = require("../models/Profile");
const User = require("../models/User");
const ProfileView = require("../models/ProfileView");
const auth = require("../middleware/auth");
const {
  formatValidationError,
  getErrorStatusCode,
} = require("../utils/errorFormatter");
const { asyncHandler } = require("../middleware/errorHandler");
const monetizationConfig = require("../config/monetization");
const { sendEmail } = require("../services/emailService");
const {
  isValidUniversityEmail,
  detectUniversityFromEmail,
} = require("../config/universities");

const router = express.Router();


const canAccessContactInfo = (user) => {
  
  return isValidUniversityEmail(user.email) || user.alumniVerified;
};


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}




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

    
    if (!isValidUniversityEmail(user.email) && !user.alumniVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Only verified university students and verified alumni can create biodata. You can still browse profiles and unlock contacts with credits.",
      });
    }

    
    if (user.hasProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists",
      });
    }

    
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

    
    console.log("Creating profile for user:", user._id);
    console.log("Profile data received:", JSON.stringify(req.body, null, 2));

    
    if (!user.profileId) {
      
      const universityInfo = detectUniversityFromEmail(user.email);
      if (universityInfo) {
        await User.findByIdAndUpdate(
          user._id,
          { university: universityInfo.key },
          { runValidators: false }
        );
        user.university = universityInfo.key;
      }
      user.profileId = await User.generateProfileId(user.university);
      await User.findByIdAndUpdate(
        user._id,
        { profileId: user.profileId },
        { runValidators: false }
      );
    } else {
      
      const universityInfo = detectUniversityFromEmail(user.email);
      if (universityInfo && user.university !== universityInfo.key) {
        await User.findByIdAndUpdate(
          user._id,
          { university: universityInfo.key },
          { runValidators: false }
        );
        user.university = universityInfo.key;
      }
    }

    
    const profile = new Profile({
      userId: user._id,
      profileId: user.profileId,
      biodataId: user.profileId,
      university: user.university,
      ...req.body,
    });

    try {
      await profile.save();

      
      await User.findByIdAndUpdate(
        user._id,
        { hasProfile: true },
        { runValidators: false }
      );

      res.status(201).json({
        success: true,
        message:
          "Profile created successfully. You will receive an email notification once your profile is approved.",
        profile,
      });
    } catch (validationError) {
      
      if (validationError.name === "ValidationError") {
        const formattedError = formatValidationError(validationError);
        return res.status(400).json({
          success: false,
          message: formattedError.message,
          errors: formattedError.errors,
          details: formattedError.details,
        });
      }
      
      throw validationError;
    }
  })
);




router.get("/search", async (req, res) => {
  try {
    
    let currentUser = null;
    if (req.headers.authorization || req.cookies?.token) {
      try {
        const token =
          req.headers.authorization?.split(" ")[1] || req.cookies.token;
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.userId).select(
          "_id isRestricted isBanned"
        );
      } catch (error) {
        
      }
    }

    
    if (currentUser && (currentUser.isRestricted || currentUser.isBanned)) {
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
      university,
      page = 1,
      limit = 10,
    } = req.query;

    
    const { sanitizeProfileSearchQuery } = require("../utils/sanitizeQuery");

    
    const filters = sanitizeProfileSearchQuery(req.query);

    const allProfiles = await Profile.find(filters)
      .populate({
        path: "userId",
        select: "isRestricted",
        match: { isRestricted: { $ne: true } }, 
      })
      .select("-privacy -contactInformation -personalContactInfo -__v")
      .lean();

    
    const filteredProfiles = allProfiles.filter(
      (profile) => profile.userId !== null
    );

    
    let viewedProfileIds = new Set();
    if (currentUser) {
      const viewedProfiles = await ProfileView.find({
        userId: currentUser._id,
        profileId: { $in: filteredProfiles.map((p) => p._id) },
      }).select("profileId");
      viewedProfileIds = new Set(
        viewedProfiles.map((v) => v.profileId.toString())
      );
    }

    
    const profilesWithViewStatus = filteredProfiles.map((profile) => ({
      ...profile,
      isViewed: viewedProfileIds.has(profile._id.toString()),
    }));

    
    shuffleArray(profilesWithViewStatus);

    
    const total = profilesWithViewStatus.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const profiles = profilesWithViewStatus.slice(skip, skip + parseInt(limit));

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




router.get(
  "/my-unlocks",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    
    if (!canAccessContactInfo(user)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only verified university students and alumni can view unlocked profiles.",
      });
    }

    
    if (!user.unlockedContacts || user.unlockedContacts.length === 0) {
      return res.json({
        success: true,
        profiles: [],
        message: "No unlocked profiles found",
      });
    }

    
    const profiles = await Profile.find({
      profileId: { $in: user.unlockedContacts },
      status: "approved",
    })
      .select("profileId biodataId age location contactInformation createdAt")
      .lean();

    
    const profilesWithBiodataId = profiles.map((profile) => ({
      ...profile,
      biodataId: profile.biodataId || profile.profileId,
    }));

    
    const profilesWithUnlockTime = profilesWithBiodataId.map((profile) => ({
      ...profile,
      unlockedAt: new Date(), 
    }));

    res.json({
      success: true,
      profiles: profilesWithUnlockTime,
    });
  })
);




router.get("/:profileId", async (req, res) => {
  try {
    
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
          .select(
            "name email profileId isActive role credits isRestricted isBanned"
          )
          .lean();
      }
    } catch (authError) {
      
      console.log(
        "Profile view: User not authenticated, treating as public view"
      );
    }

    
    const { sanitizeId } = require("../utils/sanitizeQuery");

    
    const profileId = sanitizeId(req.params.profileId);
    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile ID",
      });
    }

    
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    })
      .populate("userId", "name email isRestricted")
      .select("-__v"); 

    if (!profile) {
      
      const pendingProfile = await Profile.findOne({
        profileId: profileId,
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

    
    if (profile.status === "hidden" || profile.userId?.isRestricted) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    
    if (currentUser && (currentUser.isRestricted || currentUser.isBanned)) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    
    if (
      currentUser &&
      profile.userId._id.toString() !== currentUser._id.toString()
    ) {
      
      Profile.findByIdAndUpdate(profile._id, { $inc: { viewCount: 1 } })
        .exec()
        .catch((err) => console.log("View count update failed:", err));

      
      ProfileView.findOneAndUpdate(
        { userId: currentUser._id, profileId: profile._id },
        { viewedAt: new Date() },
        { upsert: true, new: true }
      )
        .exec()
        .catch((err) => console.log("User view tracking failed:", err));
    }

    
    const profileResponse = profile.toObject();
    const isOwner =
      currentUser &&
      currentUser._id.toString() === profile.userId._id.toString();
    const isAdmin = currentUser && currentUser.role === "admin";
    const canAccessContact =
      isOwner ||
      isAdmin ||
      (profile.privacy?.showContactInfo && canAccessContactInfo(currentUser));

    
    if (!isOwner && !isAdmin) {
      delete profileResponse.personalContactInfo;
    }

    
    if (!isOwner && !isAdmin) {
      delete profileResponse.contactInformation;
    }

    
    if (!isOwner && !isAdmin) {
      delete profileResponse.userId.name;
      delete profileResponse.userId.email;
    }

    
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




router.get("/user/me", auth, async (req, res) => {
  try {
    
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

    
    const isEdit = profile.editCount > 0 || profile.status === "approved";
    const wasApproved = profile.status === "approved";

    
    const changedFields = [];
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        
        const currentValue = profile[key];
        const newValue = req.body[key];

        
        if (currentValue !== newValue) {
          changedFields.push(key);
        }

        profile[key] = newValue;
      }
    });

    
    if (isEdit) {
      profile.status = "pending_approval";
      profile.isUnderReview = true;
      profile.hasEditPending = true;
      profile.rejectionReason = null; 

      
      changedFields.forEach((field) => {
        if (!profile.editedFields.includes(field)) {
          profile.editedFields.push(field);
        }
      });
    }

    
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

    
    const user = await User.findById(req.user.id);
    if (user && user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    
    await Profile.findByIdAndDelete(profile._id);

    
    if (user) {
      await User.findByIdAndUpdate(
        user._id,
        { hasProfile: false },
        { runValidators: false }
      );
    }

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);




router.post(
  "/:profileId/unlock-contact",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    
    const isOwner = profile.userId._id.toString() === userId;
    const isAdmin = user.role === "admin";

    
    if (isOwner) {
      return res.json({
        success: true,
        message: "Contact information accessed",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    
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

    
    const canUnlock = canAccessContactInfo(user);
    if (!canUnlock) {
      return res.status(403).json({
        success: false,
        message:
          "Contact information is restricted to verified university students and alumni only.",
      });
    }

    
    if (!monetizationConfig.shouldRequireCreditsForContact()) {
      
      return res.json({
        success: true,
        message: "Contact information accessed (free mode)",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    
    if (user.unlockedContacts && user.unlockedContacts.includes(profileId)) {
      return res.json({
        success: true,
        message: "Contact already unlocked",
        contactInfo:
          profile.contactInformation || "No contact information provided.",
        remainingCredits: user.credits,
      });
    }

    
    const unlockCost = 1;
    if (user.credits < unlockCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${unlockCost} credit(s) to unlock contact information.`,
      });
    }

    
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: -unlockCost },
        $addToSet: { unlockedContacts: profileId },
      },
      { new: true, runValidators: false }
    );

    
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
      remainingCredits: user.credits - unlockCost,
    });
  })
);


router.get(
  "/:profileId/contact-status",
  auth,
  asyncHandler(async (req, res) => {
    const { profileId } = req.params;
    const userId = req.user.id;

    
    const profile = await Profile.findOne({
      profileId: profileId,
      status: "approved",
    }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or not approved",
      });
    }

    
    const isOwner = profile.userId._id.toString() === userId;
    const isAdmin = req.user.role === "admin";

    
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

    
    const canUnlock = canAccessContactInfo(user);
    if (!canUnlock) {
      return res.status(403).json({
        success: false,
        message:
          "Contact information is restricted to verified university students and alumni only.",
        isUnlocked: false,
        canUnlock: false,
      });
    }

    
    return res.json({
      success: true,
      isUnlocked: false,
      canUnlock: true,
      remainingCredits: user.credits,
    });
  })
);




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

    
    const profile = await Profile.findOneAndDelete({ userId: user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    
    await User.findByIdAndUpdate(
      user._id,
      { hasProfile: false },
      { runValidators: false }
    );

    res.json({
      success: true,
      message: "Profile deleted successfully",
    });
  })
);




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

    
    const universityConfig = detectUniversityFromEmail(user.email);
    if (universityConfig) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${universityConfig.name} email address.`,
      });
    }

    
    if (user.alumniVerified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified as an alumni.",
      });
    }

    
    if (user.verificationRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Verification request already submitted. Please wait for admin approval.",
      });
    }

    
    await User.findByIdAndUpdate(
      user._id,
      { verificationRequest: true },
      { runValidators: false }
    );

    res.json({
      success: true,
      message:
        "Verification request submitted successfully. Please send your proof to our Facebook page.",
    });
  })
);




router.post(
  "/migrate-universities",
  asyncHandler(async (req, res) => {
    const {
      migrateProfileUniversities,
    } = require("../utils/migrateUniversities");
    await migrateProfileUniversities();
    res.json({
      success: true,
      message: "University migration completed",
    });
  })
);

module.exports = router;
