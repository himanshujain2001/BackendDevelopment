import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileOnCloudinary = async (localFilePath) => {
    try {

        if(!localFilePath){
            console.log("Please provide file path");
            return null;
        }

        // resource_type tells about the type of file i.e. video,pdf,jpg
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // unlink file from local server in sync because apan ye nhi chahte ki background m remove hoti rhe while we want it remove first then
        // proceed further
        fs.unlinkSync(localFilePath)
        // (try secure_url instead of url)
        return response.url;

    } catch (error) {
        // removing file from local server
        fs.unlink(localFilePath)
        return null;
    }   
}

export { uploadFileOnCloudinary }