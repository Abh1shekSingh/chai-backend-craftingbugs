import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title && !description) {
        throw new ApiError(400, "Title or Description is required");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath) {
        throw new ApiError(400, "Video File Missing");
    }

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is Required");
    }

    const video = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!video) {
        throw new ApiError(400, "Error Uploading Video");
    }

    if(!thumbnail) {
        throw new ApiError(400, "Eroor Uploading Thumbnail");
    }

    const newVideo = await Video.create({
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        duration:video?.duration,
        isPublished:true,
        owner: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video Uploaded Successfully"));


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(404, "No Video Exist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Fetched Successfully"));

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId) {
        throw new ApiError(404, "No Video Exist");
    }

    const { title, description } = req.body;

    const thumbnailLocalPath = req.file?.path;
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail) {
        throw new ApiError(400,"Error Uploading Thumbnail");
    }

    const updateVideoDetails = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail
            }
        },
        {
            new:true
        }
    )

    if(!updateVideoDetails) {
        throw new ApiError(400, "Error updating video details");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateVideoDetails,"Successfully Updated Video Details"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId) {
        throw new ApiError(404, "No Video Exist");
    }

    const videoToDelete = await Video.findByIdAndDelete(videoId);
    
    if(!videoToDelete) {
        throw new ApiError(400, "Error Deleting the Video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) {
        throw new ApiError(404, "No Video Exisit");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished : {
                $not:"$isPublished";
            }
        }
    })

    if(!updateVideo) {
        throw new ApiError(400, "Error Toggling the Published Status");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Succesfully Toggle the Published Status"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}