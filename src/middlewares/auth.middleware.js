import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// ye middleware sirf isiliye banaya h taaki logout m apan ko user ka access mil ske kyuki aise user ko access kaise krenge udhar
export const verifyJWT = asyncHandler ( async (req, res, next ) => {
    // Headers m authorization key m value Bearer <token> aise pass krte h to apan ko to sirf token chahiye isiliye bearer ko replace kr rhe h empty string se
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log('Access token:', token);
        
        if(!token)
            throw new Error(400, "Unauthorized request")
    
        // verfiy whether the above token we got is correct or not
        // here in decodedAccessToken we get the whole object which we passed while generating access token along with expiry
        const decodedAccessToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        console.log("Decoded token: ", decodedAccessToken);
        
        // here _id is same as we passed while generating access token
        const user = await User.findById(decodedAccessToken?._id).select("-password -refreshToken")
    
        if(!user)
            throw new ApiError(400, "Invalid access token")
    
        req.authorizedUser = user
        
        next()

    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Access Token")
    }
})