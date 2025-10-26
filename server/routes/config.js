const express = require("express");
const monetizationConfig = require("../config/monetization");

const router = express.Router();

// @route   GET /api/config/monetization
// @desc    Get current monetization configuration status
// @access  Public
router.get("/monetization", (req, res) => {
  try {
    const config = monetizationConfig.getConfigSummary();

    res.json({
      success: true,
      monetization: config.monetization,
      creditSystemEnabled: config.creditSystem,
      freeAccess: config.freeAccess,
      message: config.message,
      serverTimestamp: global.SERVER_STARTUP_TIME || Date.now(),
    });
  } catch (error) {
    console.error("Error getting monetization config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get configuration",
      // Default to safe mode (free access) if there's an error
      monetization: "off",
      creditSystemEnabled: false,
      freeAccess: true,
      serverTimestamp: Date.now(),
    });
  }
});

module.exports = router;
