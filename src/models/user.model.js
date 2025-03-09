import { timeStamp } from "console"
import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        }
    ],
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true, // index se searching easy ho jaati h
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true
    },    
    avatar: {
        type: String, // url
        required: true
    },    
    coverImage: {
        type: String
    },    
    password: {
        type: String,
        required: [true, "Password is required"]
    },    
    refreshToken: {
        type: String
        
    }

}, {timeStamps: true})

export const User = mongoose.model("User", userSchema)