const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");
const router = express.Router();
router.use(authMiddleware);
router.get("/", notificationController.listNotifications);
router.patch("/read/all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
module.exports = router;
