const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const ratingController = require("../controllers/ratingController");
const router = express.Router();
router.use(authMiddleware);
router.post("/:rideId", ratingController.createRating);
router.get("/user/:userId", ratingController.getUserRatings);
module.exports = router;
