const express = require("express");
const rideController = require("../controllers/rideController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", rideController.createRide);
router.get("/", rideController.listRides);
router.get("/my", rideController.myRides);
router.get("/:id", rideController.getRideById);
router.patch("/:id/status", rideController.updateRideStatus);
router.patch("/:id/accept", rideController.acceptRide);
router.patch("/:id/cancel-accept", rideController.cancelAcceptance);
router.patch("/:id/location", rideController.updateLocation);
router.patch("/:id/finish", rideController.finalizeRide);
router.patch("/:id/start", rideController.startRide);

module.exports = router;