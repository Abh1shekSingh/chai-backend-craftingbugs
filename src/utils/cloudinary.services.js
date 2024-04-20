import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadToCloudinary = async (filePathName) => {
    try {
        if(!filePathName) return null
        //  uploading the file to cloudinary
        console.log("In the cloudinary method", filePathName)
        const Response = await cloudinary.uploader.upload(filePathName, {
            resource_type: "auto",
        })

        //Successfully Uploaded to Cloudinary
        fs.unlinkSync(filePathName); // delete the file from the local storage
        return Response;
    }catch(err) {
        fs.unlinkSync(filePathName); // delete the file from the local storage
        return null;
    }
}

export { uploadToCloudinary }

