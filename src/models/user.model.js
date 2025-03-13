import { timeStamp } from "console"
import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
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
        match: /.+\@.+\..+/
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
        required: [true, "Password is required"],
        minlength: 8
    },    
    refreshToken: {
        type: String
        
    }

}, {timestamps: true})

// Password encryption: 
// 1. jaise hi user n first time password daala ya existing pswd ko update kiya tabhi apan password ko save krayenge to if condition m vhi handle
//    kr rhe h i.e. tabhi pswd ko save krvayenge varna aage badh jaayenge
// 2. pswd encryptn is time taking to async ka use krenge and arrow functn use nhi kiya callback m kyu ki they doesn't have context i.e. this
//    keyword use nhi kr skte unme

userSchema.pre("save", async function (next) {

    if(!this.isModified("password"))  return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

// this is the way to add instance methods to schema in mongoose. so isPasswordSame is an instance method which is added to userSchema now.
userSchema.methods.isPasswordSame = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

export const User = mongoose.model("User", userSchema)