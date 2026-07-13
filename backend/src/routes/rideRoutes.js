const express = require("express");
const rideController = require("../controllers/rideController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", rideController.createRide);
router.get("/", rideController.listRides);
router.get("/my", rideController.myRides);
router.patch("/:id/status", rideController.updateRideStatus);
router.patch("/:id/accept", rideController.acceptRide);

module.exports = router;