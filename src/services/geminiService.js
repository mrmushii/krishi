import { GoogleGenerativeAI } from '@google/generative-ai'

// You need to get a free API key from: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE'

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

/**
 * Convert image file to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Analyze crop quality using Gemini Vision API
 */
export const analyzeCropQuality = async (imageFile, cropType = 'general') => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('Please set VITE_GEMINI_API_KEY in your .env file')
    }

   const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })


    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile)
    
    // Detect MIME type
    const mimeType = imageFile.type || 'image/jpeg'

    // Create the prompt
    const prompt = `Analyze this ${cropType} crop image and provide a comprehensive quality assessment.

Please analyze the image and provide:
1. Quality Rating: A number from 1-10 (where 1 is worst/spoiled and 10 is best/fresh)
2. Condition Assessment: 
   - Is the crop fresh, good, average, poor, or spoiled/rotten?
   - Are there any visible defects, rot, mold, bruises, or damage?
   - What is the overall condition?
3. Freshness Indicators:
   - Color vibrancy
   - Texture appearance
   - Any signs of spoilage
   - Overall presentation
4. Recommendation:
   - If fresh (rating 7-10): Provide a brief recommendation describing why it's good quality and suitable for sale
   - If not fresh or spoiled (rating 1-4): Describe the issues and why it should not be recommended
   - If average (rating 5-6): Provide balanced feedback

Please format your response as JSON:
{
  "rating": <number 1-10>,
  "condition": "<fresh|good|average|poor|spoiled|rotten>",
  "defects": ["list of any visible defects"],
  "freshness_indicators": "description of freshness indicators",
  "is_recommended": <true|false>,
  "recommendation": "brief recommendation description",
  "analysis_details": "detailed analysis of the crop quality"
}`

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    // Try to extract JSON from the response
    let analysisResult
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        // Fallback parsing
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      // Fallback: Try to extract information manually
      const ratingMatch = text.match(/rating[:\s]+(\d+)/i)
      const conditionMatch = text.match(/condition[:\s]+(fresh|good|average|poor|spoiled|rotten)/i)
      const recommendedMatch = text.match(/recommended[:\s]+(true|false|yes|no)/i)
      
      analysisResult = {
        rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
        condition: conditionMatch ? conditionMatch[1].toLowerCase() : 'average',
        defects: [],
        freshness_indicators: text.substring(0, 200),
        is_recommended: recommendedMatch ? (recommendedMatch[1].toLowerCase() === 'true' || recommendedMatch[1].toLowerCase() === 'yes') : false,
        recommendation: text.substring(0, 300),
        analysis_details: text
      }
    }

    // Ensure rating is between 1-10
    if (analysisResult.rating < 1) analysisResult.rating = 1
    if (analysisResult.rating > 10) analysisResult.rating = 10

    return {
      success: true,
      ...analysisResult,
      rawResponse: text
    }
  } catch (error) {
    console.error('Error analyzing crop:', error)
    return {
      success: false,
      error: error.message || 'Failed to analyze crop image',
      rating: 5,
      condition: 'unknown',
      is_recommended: false,
      recommendation: 'Unable to analyze. Please try again.'
    }
  }
}

/**
 * Analyze multiple crop images and return average rating
 */
export const analyzeMultipleCrops = async (imageFiles, cropType = 'general') => {
  try {
    const analyses = await Promise.all(
      imageFiles.map(file => analyzeCropQuality(file, cropType))
    )

    const successful = analyses.filter(a => a.success)
    if (successful.length === 0) {
      return {
        success: false,
        error: 'Failed to analyze any images'
      }
    }

    const avgRating = successful.reduce((sum, a) => sum + a.rating, 0) / successful.length
    const conditions = successful.map(a => a.condition)
    const allDefects = successful.flatMap(a => a.defects || [])
    const isRecommended = successful.every(a => a.is_recommended)

    return {
      success: true,
      rating: Math.round(avgRating * 10) / 10,
      condition: conditions.some(c => c === 'rotten' || c === 'spoiled') ? 'spoiled' : 
                 conditions.some(c => c === 'poor') ? 'poor' :
                 conditions.some(c => c === 'average') ? 'average' :
                 conditions.some(c => c === 'good') ? 'good' : 'fresh',
      defects: [...new Set(allDefects)],
      is_recommended: isRecommended,
      analyses: successful,
      recommendation: isRecommended 
        ? `All ${successful.length} images show good quality crops suitable for sale.`
        : `Some crops may have quality issues. Review individual analyses.`
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to analyze crops'
    }
  }
}

