import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router();


router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ]), // it can take multiple files
    // using middleware before hitting the register user route
    registerUser
);

export default router;