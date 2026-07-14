const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/recuperar-senha", userController.forgotPassword);
router.post("/resetar-senha", userController.resetPassword);

router.use(authMiddleware);

router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);
router.patch("/me/avatar", upload.single("avatar"), userController.uploadAvatar);
router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);

module.exports = router;