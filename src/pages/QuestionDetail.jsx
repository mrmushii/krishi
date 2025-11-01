import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getQuestion, postAnswer, voteOnPost, acceptAnswer, incrementViews } from '../services/communityService'
import Navbar from '../components/Navbar'
import Button from '../components/Button'

export default function QuestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      loadQuestion()
    }
  }, [id])

  const loadQuestion = async () => {
    setLoading(true)
    try {
      const data = await getQuestion(id)
      setQuestion(data)
      if (data && user) {
        await incrementViews(id)
      }
    } catch (err) {
      console.error('Error loading question:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to answer')
      return
    }

    setSubmitting(true)
    try {
      await postAnswer({
        questionId: id,
        content: answerContent,
        userId: user.uid,
        userName: userData?.name || user.email,
        userRole: userData?.role
      })
      setAnswerContent('')
      loadQuestion()
    } catch (err) {
      alert('Error posting answer: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (postType, postId, voteType) => {
    if (!user) {
      alert('Please sign in to vote')
      return
    }
    try {
      await voteOnPost(postType, postId, user.uid, voteType)
      loadQuestion()
    } catch (err) {
      alert('Error voting: ' + err.message)
    }
  }

  const handleAcceptAnswer = async (answerId) => {
    if (!user || user.uid !== question.userId) {
      alert('Only the question author can accept an answer')
      return
    }
    try {
      await acceptAnswer(id, answerId, user.uid)
      loadQuestion()
    } catch (err) {
      alert('Error accepting answer: ' + err.message)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Question not found</p>
            <Button onClick={() => navigate('/community')} className="mt-4">
              Back to Community
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="secondary" 
          onClick={() => navigate('/community')}
          className="mb-6"
        >
          ← Back to Community
        </Button>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 text-center">
              <button
                onClick={() => handleVote('question', question.id, 'up')}
                className="block w-10 h-10 text-gray-400 hover:text-farmlink-orange transition-colors"
              >
                <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                </svg>
              </button>
              <div className="text-2xl font-bold text-gray-700 my-2">{question.votes || 0}</div>
              <button
                onClick={() => handleVote('question', question.id, 'down')}
                className="block w-10 h-10 text-gray-400 hover:text-farmlink-orange transition-colors"
              >
                <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{question.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  question.category === 'farming' ? 'bg-green-100 text-green-800' :
                  question.category === 'buying' ? 'bg-blue-100 text-blue-800' :
                  question.category === 'pricing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {question.category}
                </span>
                {question.tags?.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.content}</p>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">{question.userName}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {question.userRole}
                  </span>
                  <span>•</span>
                  <span>Asked {formatDate(question.createdAt)}</span>
                  <span>•</span>
                  <span>{question.views || 0} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {question.answers?.length || 0} {question.answers?.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          {question.answers && question.answers.length > 0 ? (
            <div className="space-y-4">
              {question.answers.map(answer => (
                <div 
                  key={answer.id}
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    answer.isAccepted ? 'border-2 border-green-500' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-center">
                      <button
                        onClick={() => handleVote('answer', answer.id, 'up')}
                        className="block w-10 h-10 text-gray-400 hover:text-farmlink-orange transition-colors"
                      >
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                        </svg>
                      </button>
                      <div className="text-xl font-bold text-gray-700 my-2">{answer.votes || 0}</div>
                      <button
                        onClick={() => handleVote('answer', answer.id, 'down')}
                        className="block w-10 h-10 text-gray-400 hover:text-farmlink-orange transition-colors"
                      >
                        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                      </button>
                      {answer.isAccepted && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            ✓ Accepted
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-gray-700 whitespace-pre-wrap mb-4">{answer.content}</p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium">{answer.userName}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {answer.userRole}
                          </span>
                          <span>•</span>
                          <span>{formatDate(answer.createdAt)}</span>
                        </div>
                        {user && user.uid === question.userId && !answer.isAccepted && (
                          <Button
                            variant="outline"
                            onClick={() => handleAcceptAnswer(answer.id)}
                            className="text-sm"
                          >
                            Accept Answer
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No answers yet. Be the first to answer!</p>
            </div>
          )}
        </div>

        {/* Answer Form */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Answer</h2>
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Write your answer here..."
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange mb-4"
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Answer'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

