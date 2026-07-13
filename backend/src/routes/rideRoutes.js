const express = require("express");
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", ratingController.createRating);
router.get("/pending", ratingController.listMyPendingRatings);

module.exports = router;