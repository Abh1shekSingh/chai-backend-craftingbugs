import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", ""); // as it is store as -> Bearer <token>, now to get oonly token we use split method
        if(!token) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user; // this way we are getting access of user in the logout method
        next()
    } 
    catch(error) {
        new ApiError(401, "Invalid Access Token")
    }
    

}) 