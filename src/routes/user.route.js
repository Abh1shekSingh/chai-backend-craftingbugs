import { Router } from "express";
import { changePassword, getCurrentUser, getUserProfileDetails, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ]), // it can take multiple files
    // using middleware before hitting the register user route
    registerUser
);

router.route("/login").post(loginUser)

//Secure Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-user").patch(verifyJWT,updateUserDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
router.route("/c/:username").get(verifyJWT,getUserProfileDetails);
router.route("/watch-history").get(verifyJWT,getWatchHistory);

export default router;