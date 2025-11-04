const express = require("express");
const router = express.Router();
const Draft = require("../models/Draft");
const auth = require("../middleware/auth");




router.get("/", auth, async (req, res) => {
  try {
    const draft = await Draft.findOne({ userId: req.user.id });

    if (!draft) {
      return res.json({ success: true, draft: null });
    }

    res.json({
      success: true,
      draft: {
        currentStep: draft.currentStep,
        draftData: draft.draftData,
        lastModified: draft.lastModified,
      },
    });
  } catch (error) {
    console.error("Error fetching draft:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching draft",
    });
  }
});




router.post("/", auth, async (req, res) => {
  try {
    const { currentStep, draftData } = req.body;

    
    if (!currentStep || !draftData) {
      return res.status(400).json({
        success: false,
        message: "Current step and draft data are required",
      });
    }

    if (currentStep < 1 || currentStep > 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid step number",
      });
    }

    
    let draft = await Draft.findOne({ userId: req.user.id });

    
    if (draft && draft.lastModified) {
      const timeSinceLastUpdate = Date.now() - draft.lastModified.getTime();
      if (timeSinceLastUpdate < 5000) {
        return res.json({
          success: true,
          message: "Draft saved (throttled)",
          draft: {
            currentStep: draft.currentStep,
            lastModified: draft.lastModified,
          },
        });
      }
    }

    if (draft) {
      
      draft.currentStep = currentStep;
      draft.draftData = draftData;
      await draft.save();
    } else {
      
      draft = new Draft({
        userId: req.user.id,
        currentStep,
        draftData,
      });
      await draft.save();
    }

    res.json({
      success: true,
      message: "Draft saved successfully",
      draft: {
        currentStep: draft.currentStep,
        lastModified: draft.lastModified,
      },
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving draft",
    });
  }
});




router.delete("/", auth, async (req, res) => {
  try {
    const result = await Draft.findOneAndDelete({ userId: req.user.id });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No draft found to delete",
      });
    }

    res.json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting draft",
    });
  }
});

module.exports = router;
