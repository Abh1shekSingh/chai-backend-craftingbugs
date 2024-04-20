import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //Get user details from the request body

    //validation

    //already exist ? check with emaila nd username 

    //Get files (images nad avatar)

    //upload them to cloudinary

    //create user object - create entru in DB

    //remove password and refresh token field from response

    //check for user creation

    //return response / error

    const { fullname, username, email, password } = req.body
    console.log(fullname)
    if([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}] // to check multiple values
    })

    if(existedUser) {
        throw new ApiError(409, "Email or Username already exists")
    }

    //Get files (images and avatar)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // This line of code gives error if in rsponse we dont send the cover IMage to fix it
    // console.log(req.files)

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    } 
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    //upload them to cloudinary
    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)

    if(!avatar ) {
        throw new ApiError(400, "Error uploading avatar")
    }

    // Database Entry

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // This will remove password and refreshToken from the response
    )

    if(!createdUser) {
        throw new ApiError(500, "Error creating user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully!")
    )

})

export { registerUser };