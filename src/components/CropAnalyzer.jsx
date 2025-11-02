import { useState, useCallback } from 'react'
import { analyzeCropQuality, analyzeMultipleCrops } from '../services/geminiService'
import Button from './Button'
import Input from './Input'

export default function CropAnalyzer({ onAnalysisComplete, cropType = 'general' }) {
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setSelectedImages(files)
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(previews)
    setAnalysisResult(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image')
      return
    }

    setAnalyzing(true)
    setAnalysisResult(null)

    try {
      let result
      if (selectedImages.length === 1) {
        result = await analyzeCropQuality(selectedImages[0], cropType)
      } else {
        result = await analyzeMultipleCrops(selectedImages, cropType)
      }

      setAnalysisResult(result)
      
      if (onAnalysisComplete && result.success) {
        onAnalysisComplete(result)
      }
    } catch (error) {
      setAnalysisResult({
        success: false,
        error: error.message || 'Failed to analyze images'
      })
    } finally {
      setAnalyzing(false)
    }
  }, [selectedImages, cropType, onAnalysisComplete])

  const handleRemoveImage = useCallback((index) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    
    // Revoke URL to free memory
    URL.revokeObjectURL(imagePreviews[index])
    
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
    setAnalysisResult(null)
  }, [selectedImages, imagePreviews])

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    if (rating >= 4) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRatingBg = (rating) => {
    if (rating >= 8) return 'bg-green-100'
    if (rating >= 6) return 'bg-yellow-100'
    if (rating >= 4) return 'bg-orange-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Crop Images for Quality Analysis
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          disabled={analyzing}
        />
        <p className="text-xs text-gray-500 mt-1">
          You can upload multiple images. AI will analyze crop quality, freshness, and detect spoilage.
        </p>
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                disabled={analyzing}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedImages.length > 0 && (
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full"
        >
          {analyzing ? 'Analyzing Crop Quality...' : `Analyze ${selectedImages.length} Image(s)`}
        </Button>
      )}

      {analysisResult && (
        <div className={`p-4 rounded-lg border-2 ${
          analysisResult.success 
            ? analysisResult.is_recommended 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {analysisResult.success ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Analysis Result</h3>
                <div className={`px-4 py-2 rounded-full ${getRatingBg(analysisResult.rating)} ${getRatingColor(analysisResult.rating)} font-bold text-xl`}>
                  {analysisResult.rating}/10
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="font-medium">Condition: </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    analysisResult.condition === 'fresh' ? 'bg-green-100 text-green-800' :
                    analysisResult.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                    analysisResult.condition === 'average' ? 'bg-yellow-100 text-yellow-800' :
                    analysisResult.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {analysisResult.condition.toUpperCase()}
                  </span>
                </div>

                {analysisResult.defects && analysisResult.defects.length > 0 && (
                  <div>
                    <span className="font-medium">Defects Detected: </span>
                    <span className="text-red-600">{analysisResult.defects.join(', ')}</span>
                  </div>
                )}

                {analysisResult.freshness_indicators && (
                  <div>
                    <span className="font-medium">Freshness Indicators: </span>
                    <span className="text-gray-700">{analysisResult.freshness_indicators}</span>
                  </div>
                )}

                <div className={`p-3 rounded ${analysisResult.is_recommended ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <span className="font-medium">
                    {analysisResult.is_recommended ? '✅ Recommended' : '⚠️ Not Recommended'}
                  </span>
                  <p className="text-sm mt-1">{analysisResult.recommendation}</p>
                </div>

                {analysisResult.analysis_details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                      View Detailed Analysis
                    </summary>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {analysisResult.analysis_details}
                    </p>
                  </details>
                )}
              </div>
            </>
          ) : (
            <div className="text-red-600">
              <p className="font-medium">Analysis Failed</p>
              <p className="text-sm">{analysisResult.error}</p>
              {analysisResult.error?.includes('API_KEY') && (
                <p className="text-xs mt-2">
                  Please set VITE_GEMINI_API_KEY in your .env file. Get a free API key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                    Google AI Studio
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

