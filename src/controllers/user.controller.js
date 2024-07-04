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


const changePassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect Password");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed SuccessFully"));


})


const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"));
})

const updateUserDetails = asyncHandler( async(req, res) => {
    const { fullname, email } = req.body;

    if(!fullname || !email) {
        throw new ApiError(400, "All Fields Are required");
    }

    const user = User.findByIdAndUpdate(req.user?._id, {$set: {fullname, email}}, {new:true}).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar Image Missing");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(400, "Error While Uploading Avatar");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {$set: {avatar:avatar.url}}, {new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image Updated Successfully"));
})
const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image Missing");
    }

    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(400, "Error While Uploading CoverImage");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {$set: {avatar:coverImage.url}}, {new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
})

// Writing MongoDB aggregate pipeline

const getUserProfileDetails = asyncHandler( async(req, res) => {
    const { username } = req.params;
    if(!username?.trim()) {
        throw new ApiError(400, "Username is Missing");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"Subscribers"
            }
        },
        {
            $lookup: {
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"SubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size:"$Subscribers"
                },
                subscribedToCount:{
                    $size: "$SubscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$in:[req.user?._id, "$Subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                fullname:1,
                email:1,
                subscribedToCount:1,
                subscribersCount:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1
            }
        }
    ])
    if(!channel?.length) {
        throw new ApiError(400, "Channel does not Exist!");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channel[0],"User Channel Fetched Successfully!"));
    
})


const getWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline : [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
})



export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateUserDetails, updateUserAvatar, updateUserCoverImage, getUserProfileDetails, getWatchHistory };