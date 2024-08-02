import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId) {
        throw new ApiError(404, "Video Does not Exist");
    }

    const allComments = await Comment.aggregate([
        {
            $match: {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit:limit
        }
    ])

    if(!allComments) {
        throw new ApiError(404, "No Comments Found on this video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, allComments, "Fetched All Comments Successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params; 
    const { content }  = req.body;


    if(!videoId) {
        throw new ApiError(404, "No Video Exist");
    }

    if(!content) {
        throw new ApiError(404,"Comment cannot be empty");
    }

    const videoExist = await Video.findById(videoId);

    if(!videoExist) {
        throw new ApiError(404, "No Video Exist");
    }


    const comment = await Comment.create({
        content,
        video:videoExist?._id,
        owner:req.user?._id
    })

    if(!comment) {
        throw new ApiError(400, "Error Commenting on this video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "You Commented on the Video"));

    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if(!commentId){
        throw new ApiError(404, "Comment Does not Exist!");
    }

    console.log(commentId);

    const { updatedComment } = req.body;
    console.log(req.body)

    if(!updatedComment) {
        throw new ApiError(404, "Comment is required");
    }

    const updateCommentDetails = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content:updatedComment
            }
        },
        {
            new:true
        }
    )

    if(!updateCommentDetails) {
        throw new ApiError(400, "Error updataing the comment");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateCommentDetails, "Successfully Updated the comment"));

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if(!commentId) {
        throw new ApiError(404, "No Comment found!")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    if(!deleteComment) {
        throw new ApiError(400, "Error Deleting the comment");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment Deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }