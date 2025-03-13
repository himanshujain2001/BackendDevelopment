import { asyncHandler } from "../utils/asyncHandler.js";
import { validateFields } from "../utils/validateFields.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFileOnCloudinary } from "../utils/uploadfile.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// Generate Access and Refresh Token

const generateAccessAndRefreshToken = async (userID) => {
    try {
        // vaapas se user find krne pdega because jo phle find kiya hua h vo const h usme changes krenge to vo reflect nhi honge
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // add and save refresh token in DB
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(400, "There is an error in generating Access and Refresh token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    
// Validation
    try {
        validateFields(req.body, ["username", "email", "password", "fullName"])
        console.log("All fields are correct");
    } catch (error) {
        console.log(error);
    }

// Check for user already exists
// req.body m sirf normal data, json hi aata h url se data ya files nhi aati
    const {username, email, password, fullName} = req.body
    console.log("Data in req.body:",req.body);
    

    const existingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existingUser)
        throw new ApiError(409, "User already exists")

// Validate Images

// ?. represents optional chaining. ex: req.files?. means it checks whether req.files exists or not if not then it will return undefined
// req.files -> ye multer se aa rha h 

    const avatarLocalPath = req.files?.avatar[0]?.path

    console.log("Data in req.files:",req.files);

    if(!avatarLocalPath)
        throw new ApiError(400, "Avatar is required")
    
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
        coverImageLocalPath = req.files.coverImage[0].path;

    // Upload on cloudinary
    const avatar = await uploadFileOnCloudinary(avatarLocalPath)
    const coverImage = await uploadFileOnCloudinary(coverImageLocalPath)
    
    if(!avatar)
        throw new ApiError(400, "Avatar is required")

    const userSavedToDB = await User.create({
        username,
        email,
        password,
        avatar: avatar,
        coverImage: coverImage ? coverImage : "",
        fullName
    })

// Check whether the user is successfully created and if yes then remove password and refreshToken fields from it as we don't want it to send to
// user back
    const createdUser = await User.findById(userSavedToDB._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
        throw new ApiError(500, "User not registered successfully")

// return response back to user
    return res.status(201).json(
            new ApiResponse(200, "User registered successfully", createdUser)
    )

})

const loginUser = asyncHandler ( async (req, res) => {

    // steps:
    // get data entered by user using req.body
    // login using username/email
    // check username/email exists and compare pswd
    // login and generate access and refresh token
    // send both tokens to user using cookie

    const { username, email, password } = req.body

    if(!(username || email))
        throw new ApiError(400, "Please enter username or email")

    // User pe find functn laga rhe h kyu ki User schema mongoose se banaya h aur vo hi DB se baat krega
    // findOne -> mentioned conditn k acco jo bhi sabse phla record milega vo return kr dega
    // $or is mongoDB operator
    let foundUser = await User.findOne({
        $or: [{username},{email}]
    })

    console.log("User founded using provided email or username",foundUser);
    
    if(!foundUser)
        throw new ApiError(404, "User is not registered. Please register")

    // Password Validation
    const validPassword = await foundUser.isPasswordSame(password)

    if(!validPassword)
        throw new ApiError(401, "Password doesn't match")

    console.log("Password matched");
    
    // Generate Access and Refresh Token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(foundUser._id)

    // Send cookie
    // to apan ko user ko jo data bhejna h usme pswd, refreshToken to bhejna nhi h (because refresh token cookie vaala use krenge compare
    // k time) to user find kiya aur us field ko remove kr diya
    foundUser = await User.findById(foundUser._id).select("-password -refreshToken")

    console.log("User data after removing password and refreshToken", foundUser);
    
    // cookies ko koi bhi modify kr skta h aise to lekin jab apan below 2 fields add kr dete h to phir vo user k liye readonly rhte h unko
    // modify only server krta h
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict" // cookies will be sent on the request which r originating from same domain means it'll block from cross domains
    }

    // cookies .cookie method use kr k send krte h key-value ki form m
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json( new ApiResponse( 200, { user: foundUser}, "User logged in successfully"))
})

// Logout
// logout k liye cookies clear krni pdegi aur refresh token bhi remove krna pdega
const logoutUser = asyncHandler( async (req, res ) => {

    // middleware banaya h auth kyu ki User ka access chahiye tha yha pe kyu ki upar k methods m to req.body se mil rha tha
    // deleting refreshToken and returning the updated doc using new
    // the below code doesn't work as setting any data to undefined will be ignored by mongoDB

    //const user = await User.findByIdAndUpdate(req.authorizedUser._id, { $set: { refreshToken: undefined } }, { new: true })

    const user = await User.findByIdAndUpdate(req.authorizedUser._id, { $unset: { refreshToken: "" } }, { new: true })
    console.log("User data after deleting refresh token: ",user)

    // clearing cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }
    
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))
})

// jab access token ka session expire ho jaayega to endpoint pe hit kr k refresh token compare kra k naya access token generate krvaayenge
const refreshAccessToken = asyncHandler( async (req, res) => {

    const refreshToken =  req.cookies.refreshToken || req.header("refreshToken")

    if(!refreshToken)
        throw new ApiError(401, "Unauthorized access")
    
    try {
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedRefreshToken?._id)
    
        if(!user)
            throw new ApiError(400, "Invalid refresh token")
    
        if(refreshToken !== user?.refreshToken)
            throw new ApiError(400, "Cannot proceed")
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        }
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( new ApiResponse( 200, { accessToken, refreshToken : newRefreshToken}, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(400, error?.message || "Unauthorized access")
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }