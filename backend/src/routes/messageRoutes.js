const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const messageController = require("../controllers/messageController");
const router = express.Router();
router.use(authMiddleware);
router.post("/", messageController.sendMessage);
router.get("/inbox", messageController.listInbox);
router.get("/conversation/:userId", messageController.listConversation);
module.exports = router;
