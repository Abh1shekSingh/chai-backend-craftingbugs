import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// This is helper function to generate access and refresh token together
const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}
    }catch(err) {
        throw new ApiError(500, "Something Went Wrong While generating tokens")
    }
}

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

const loginUser = asyncHandler( async (req, res) => {
    // Get the data from the req body
    // username or email.
    // Find the user in the database
    // If user not found, return error
    // Otherwise, password check
    // If password is incorrect, return error
    // Generate Access and Refresh token
    // Send cookies with tokens and response

    const { username, email, password } = req.body;

    if(!username && !email) {
        throw new ApiError(400, "Username or Email is Required~")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordMatch = await user.isPasswordCorrect(password)

    if(!isPasswordMatch) {
        throw new ApiError(401, "Invalid Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // Send Cookie

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true, 
        secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully!"))
})

const logoutUser = asyncHandler( async (req, res) => {
    // Clear the Cookies
    // Now think we dont have access to the user here, then how can I delete the refresh token from the database
    // So we have to create the middleware for this purpose

    await User.findByIdAndUpdate(req.user._id, {$set: {refreshToken: undefined}}, {new :true})
    
    const options = {
        httpOnly:true, 
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully!"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = User.findById(decodedToken?._id)

    if(!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh Token is Expired");
    }

    const options = {
        httpOnly:true, 
        secure:true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, {accessToken, refreshToken : newRefreshToken} , "New Refresh Token Generated"))


})

export { registerUser, loginUser, logoutUser, refreshAccessToken };