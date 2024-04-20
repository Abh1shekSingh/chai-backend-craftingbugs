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
        const Response = await cloudinary.v2.uploader.upload(filePathName, {
            resource_type: "auto",
        })

        //Successfully Uploaded to Cloudinary
        console.log("File uploaded successfully at: ", Response.url)
        console.log(Response)
        return Response;
    }catch(err) {
        fs.unlinkSync(filePathName); // delete the file from the local storage
        return null;
    }
}

export { uploadToCloudinary }

