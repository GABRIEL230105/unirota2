const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const activityController = require("../controllers/activityController");
const router = express.Router();
router.use(authMiddleware);
router.get("/", activityController.listActivities);
module.exports = router;
