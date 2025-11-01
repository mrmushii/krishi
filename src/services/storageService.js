import { cloudinaryConfig } from '../config/cloudinary'

/**
 * Upload file to Cloudinary using unsigned upload preset
 * @param {File} file - The file to upload
 * @param {string} folder - Optional folder path (e.g., 'verification/user123')
 * @returns {Promise<string>} - The uploaded image URL
 */
export const uploadToCloudinary = async (file, folder = '') => {
  if (!cloudinaryConfig.cloudName || cloudinaryConfig.cloudName === 'your-cloud-name') {
    throw new Error('Cloudinary not configured. Please update src/config/cloudinary.js')
  }

  if (!cloudinaryConfig.uploadPreset || cloudinaryConfig.uploadPreset === 'your-upload-preset') {
    throw new Error('Cloudinary upload preset not configured. Please update src/config/cloudinary.js')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', cloudinaryConfig.uploadPreset)
  
  if (folder) {
    formData.append('folder', folder)
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Upload failed')
    }

    const data = await response.json()
    return data.secure_url // Returns the URL of the uploaded image
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error(error.message || 'Failed to upload image')
  }
}

/**
 * Upload farmer ID card
 */
export const uploadID = async (file, userId) => {
  return await uploadToCloudinary(file, `krishi/verification/${userId}/id`)
}

/**
 * Upload crop photos
 */
export const uploadCropPhoto = async (file, userId) => {
  return await uploadToCloudinary(file, `krishi/verification/${userId}/crops`)
}

/**
 * Upload any product image (for future use)
 */
export const uploadProductImage = async (file, productId) => {
  return await uploadToCloudinary(file, `krishi/products/${productId}`)
}
