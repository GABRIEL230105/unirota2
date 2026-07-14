const express = require("express");
const rideController = require("../controllers/rideController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

console.log("📦 rideRoutes.js CARREGADO");

router.use(authMiddleware);

router.post(
  "/",
  (req, res, next) => {
    console.log("🟣 Handler POST / do rideRoutes ALCANÇADO");
    next();
  },
  rideController.createRide
);

router.get("/", rideController.listRides);
router.get("/my", rideController.myRides);
router.get("/:id", rideController.getRideById);
router.patch("/:id/status", rideController.updateRideStatus);
router.patch("/:id/accept", rideController.acceptRide);
router.patch("/:id/cancel-accept", rideController.cancelAcceptance);
router.patch("/:id/location", rideController.updateLocation);
router.patch("/:id/finish", rideController.finalizeRide);

module.exports = router;