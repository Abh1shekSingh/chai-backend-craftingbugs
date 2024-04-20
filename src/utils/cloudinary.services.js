import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

const uploadToCloudinary = async (filePathName) => {
    try {
        if(!filePathName) return null
        //  uploading the file to cloudinary
        const Response = await cloudinary.v2.uploader.upload(filePathName, {
            resource_type: "auto",
        })

        //Successfully Uploaded to Cloudinary
        console.log("File uploaded successfully at: ", Response.url)

        return Response;
    }catch(err) {
        fs.unlinkSync(filePathName); // delete the file from the local storage
        return null;
    }
}

export { uploadToCloudinary }

