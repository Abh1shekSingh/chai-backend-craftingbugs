import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type:String, 
        required:true, 
        unique:true,
        lowercase:true, 
        trim:true,
        index:true
    }, 
    email: {
        type:String, 
        required:true, 
        unique:true, 
        lowercase:true, 
        trim:true,
    },
    fullname: {
        type:String, 
        required:true,  
        trim:true,
        index: true
    },
    avatar: {
        type:String, 
        required:true, 
    }, 
    coverImage: {
        type:String, 
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password: {
        type:String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    refreshToken: {
        type:String
    }
    
}, {timestamps: true})


//encryting the password with bcrypt
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next()
}) 

//checking if the password is correct
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}


//generating the access token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id, // came from mongodb
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


//generating the refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id, // came from mongodb
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);