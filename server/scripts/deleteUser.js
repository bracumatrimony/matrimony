const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Draft = require("../models/Draft");
const Bookmark = require("../models/Bookmark");
const Transaction = require("../models/Transaction");
const ProfileView = require("../models/ProfileView");
const Report = require("../models/Report");
const connectDB = require("../config/database");

dotenv.config();

const deleteUser = async (email) => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Starting deletion process for user: ${user.name} (${email})`);
    console.log(`User ID: ${user._id}`);
    console.log(`Role: ${user.role}`);

    let deletedCount = 0;

    // 1. Delete Profile (if exists)
    if (user.profileId) {
      console.log("Deleting profile...");
      const profileDeleted = await Profile.findOneAndDelete({
        profileId: user.profileId,
      });
      if (profileDeleted) {
        console.log("Profile deleted");
        deletedCount++;
      }
    }

    // 2. Delete Draft
    console.log("Deleting draft...");
    const draftDeleted = await Draft.findOneAndDelete({ userId: user._id });
    if (draftDeleted) {
      console.log("Draft deleted");
      deletedCount++;
    }

    // 3. Delete Bookmarks
    console.log("Deleting bookmarks...");
    const bookmarksDeleted = await Bookmark.deleteMany({ userId: user._id });
    if (bookmarksDeleted.deletedCount > 0) {
      console.log(`Deleted ${bookmarksDeleted.deletedCount} bookmarks`);
      deletedCount += bookmarksDeleted.deletedCount;
    }

    // 4. Delete Transactions
    console.log("Deleting transactions...");
    const transactionsDeleted = await Transaction.deleteMany({
      userId: user._id,
    });
    if (transactionsDeleted.deletedCount > 0) {
      console.log(`Deleted ${transactionsDeleted.deletedCount} transactions`);
      deletedCount += transactionsDeleted.deletedCount;
    }

    // 5. Delete ProfileViews (both as viewer and viewed)
    console.log("Deleting profile views...");
    const profileViewsDeleted = await ProfileView.deleteMany({
      $or: [{ userId: user._id }, { profileId: user._id }],
    });
    if (profileViewsDeleted.deletedCount > 0) {
      console.log(`Deleted ${profileViewsDeleted.deletedCount} profile views`);
      deletedCount += profileViewsDeleted.deletedCount;
    }

    // 6. Delete Reports (where user reported others)
    console.log("Deleting reports...");
    const reportsDeleted = await Report.deleteMany({ reportedBy: user._id });
    if (reportsDeleted.deletedCount > 0) {
      console.log(`Deleted ${reportsDeleted.deletedCount} reports`);
      deletedCount += reportsDeleted.deletedCount;
    }

    // 7. Finally, delete the User document
    console.log("Deleting user account...");
    await User.findByIdAndDelete(user._id);
    console.log("User account deleted");

    console.log(
      `\n🎉 Successfully deleted user ${email} and all associated data`
    );
    console.log(
      `Total records deleted: ${deletedCount + 1} (including user account)`
    );
  } catch (error) {
    console.error("Error deleting user:", error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Hardcode the email to delete
const email = "tasneem.bin.mahmood@g.bracu.ac.bd"; // Replace with the actual email address

deleteUser(email);
