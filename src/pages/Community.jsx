import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getQuestions, postQuestion } from '../services/communityService'
import { db } from '../config/firebase'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Community() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAskForm, setShowAskForm] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'createdAt'
  })
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  })

  useEffect(() => {
    loadQuestions()
  }, [filters])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const qFilters = {}
      if (filters.category !== 'all') {
        qFilters.category = filters.category
      }
      qFilters.sortBy = filters.sortBy
      qFilters.order = 'desc'
      
      const data = await getQuestions(qFilters)
      setQuestions(data)
    } catch (err) {
      console.error('Error loading questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to ask a question')
      return
    }

    try {
      await postQuestion({
        title: newQuestion.title,
        content: newQuestion.content,
        category: newQuestion.category,
        tags: newQuestion.tags.split(',').map(t => t.trim()).filter(t => t),
        userId: user.uid,
        userName: userData?.name || user.email,
        userRole: userData?.role,
        status: 'open'
      })
      
      setNewQuestion({ title: '', content: '', category: 'general', tags: '' })
      setShowAskForm(false)
      loadQuestions()
    } catch (err) {
      alert('Error posting question: ' + err.message)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      'farming': 'bg-green-100 text-green-800',
      'buying': 'bg-blue-100 text-blue-800',
      'pricing': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800',
      'technical': 'bg-purple-100 text-purple-800'
    }
    return colors[category] || colors.general
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Q&A</h1>
            <p className="text-gray-600">Ask questions and get answers from farmers, buyers, and agents</p>
          </div>
          <Button 
            onClick={() => setShowAskForm(!showAskForm)}
            className="mt-4 md:mt-0"
          >
            {showAskForm ? 'Cancel' : '+ Ask Question'}
          </Button>
        </div>

        {showAskForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
            <form onSubmit={handleAskQuestion}>
              <Input
                label="Question Title"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="What's your question?"
                required
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
                >
                  <option value="general">General</option>
                  <option value="farming">Farming Tips</option>
                  <option value="buying">Buying Guide</option>
                  <option value="pricing">Pricing Questions</option>
                  <option value="technical">Technical Support</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Details
                </label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  placeholder="Provide more details about your question..."
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
                  required
                />
              </div>

              <Input
                label="Tags (comma separated)"
                value={newQuestion.tags}
                onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                placeholder="e.g., tomatoes, organic, pricing"
              />

              <Button type="submit" className="w-full md:w-auto">
                Post Question
              </Button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="farming">Farming Tips</option>
                <option value="buying">Buying Guide</option>
                <option value="pricing">Pricing Questions</option>
                <option value="technical">Technical Support</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-farmlink-orange"
              >
                <option value="createdAt">Newest</option>
                <option value="answersCount">Most Answered</option>
                <option value="votes">Most Voted</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-farmlink-orange mx-auto"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(question => (
              <div 
                key={question.id}
                onClick={() => navigate(`/community/question/${question.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-shrink-0 text-center md:text-left">
                    <div className="text-2xl font-bold text-gray-700">{question.votes || 0}</div>
                    <div className="text-sm text-gray-500">votes</div>
                    <div className="text-lg font-semibold text-gray-700 mt-2">{question.answersCount || 0}</div>
                    <div className="text-sm text-gray-500">answers</div>
                    <div className="text-lg font-semibold text-gray-700 mt-2">{question.views || 0}</div>
                    <div className="text-sm text-gray-500">views</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-farmlink-orange">
                        {question.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(question.category)}`}>
                        {question.category}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags?.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{question.userName}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {question.userRole}
                        </span>
                        <span>•</span>
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                      {question.status === 'resolved' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

