import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";
import logger from "./logger.js";

/**
 * Upload image to cloudinary
 * @param {Buffer} fileBuffer
 * @param {String} folder
 * @param {String} mimeType
 * @returns {Promise<Object>}
 */

export const uploadImageToCloudinary = async (fileBuffer, folder, mimeType) => {
  let buffer = fileBuffer;

  try {
    // convert image to webp if not already
    if (mimeType !== "image/webp") {
      buffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
            format: "webp",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (error) {
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
