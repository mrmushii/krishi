// Cloudinary Configuration
// Get these from your Cloudinary dashboard: https://cloudinary.com/console

export const cloudinaryConfig = {
  cloudName: 'dpte6hpkw', // Replace with your Cloudinary cloud name
  uploadPreset: 'krishi_upload', // Create an unsigned upload preset in Cloudinary settings
  apiUrl: 'https://api.cloudinary.com/v1_1'
}

/**
 * How to set up Cloudinary:
 * 
 * 1. Sign up for free at https://cloudinary.com (Free tier: 25 GB storage, 25 GB bandwidth/month)
 * 2. Go to Dashboard → Settings
 * 3. Copy your "Cloud name"
 * 4. Go to Settings → Upload → Upload presets
 * 5. Create a new unsigned upload preset:
 *    - Name: "krishi_upload" (or any name)
 *    - Signing mode: "Unsigned"
 *    - Folder: "krishi/verification" (optional, for organization)
 *    - Copy the preset name
 * 6. Update cloudName and uploadPreset in this file
 */

