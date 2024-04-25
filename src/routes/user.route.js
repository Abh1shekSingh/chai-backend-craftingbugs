import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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

export default router;