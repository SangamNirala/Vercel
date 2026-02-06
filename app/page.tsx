'use client'

import { useState, useEffect, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  FaBalanceScale,
  FaGavel,
  FaBriefcase,
  FaUserTie,
  FaGraduationCap,
  FaFileAlt,
  FaPaperPlane,
  FaPlus,
  FaMoon,
  FaSun,
  FaCopy,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaBookOpen,
  FaLandmark,
  FaExclamationCircle
} from 'react-icons/fa'

// TypeScript interfaces based on actual agent response
interface LegalResponse {
  summary: string
  detailed_analysis: string
  case_law: string[]
  statutory_provisions: string
  practical_guidance: string
  disclaimer: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  legalResponse?: LegalResponse
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  userType: UserType
  createdAt: Date
}

type UserType = 'lawyer' | 'judge' | 'student' | 'paralegal' | 'corporate_counsel' | null

const AGENT_ID = '698588cae17e33c11eed19ce'

export default function Home() {
  const [screen, setScreen] = useState<'welcome' | 'chat'>('welcome')
  const [userType, setUserType] = useState<UserType>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load preferences from localStorage (but NOT user type - always show welcome screen)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('lexassist_dark_mode') === 'true'
    setDarkMode(savedDarkMode)
  }, [])

  // Conversations are session-only (not persisted to localStorage)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, currentConversationId])

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  const handleContinue = () => {
    if (userType) {
      setScreen('chat')
      // Create first conversation
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [{
          id: Date.now().toString(),
          role: 'assistant',
          content: `Welcome to LexAssist AI! I'm your comprehensive legal research assistant for Indian Criminal Law and Corporate Law. How can I help you today?`,
          timestamp: new Date()
        }],
        userType,
        createdAt: new Date()
      }
      setConversations([newConv])
      setCurrentConversationId(newConv.id)
    }
  }

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Welcome to LexAssist AI! I'm your comprehensive legal research assistant for Indian Criminal Law and Corporate Law. How can I help you today?`,
        timestamp: new Date()
      }],
      userType: userType!,
      createdAt: new Date()
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConversationId(newConv.id)
    setInput('')
    setError(null)
  }

  const handleSend = async (quickAction?: string) => {
    const messageText = quickAction || input.trim()
    if (!messageText || loading || !currentConversationId) return

    setLoading(true)
    setError(null)
    setInput('')

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setConversations(prev => prev.map(c =>
      c.id === currentConversationId
        ? { ...c, messages: [...c.messages, userMessage], title: c.title === 'New Chat' ? messageText.slice(0, 50) : c.title }
        : c
    ))

    try {
      // Call AI Agent
      console.log('[Page] Calling AI agent with message:', messageText)
      const result = await callAIAgent(messageText, AGENT_ID, {
        user_id: userType || undefined
      })

      console.log('[Page] AI agent result:', result)

      if (result.success && result.response.status === 'success') {
        console.log('[Page] Response result:', result.response.result)
        const legalResponse = result.response.result as LegalResponse

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: legalResponse.summary || legalResponse.detailed_analysis || JSON.stringify(legalResponse) || 'Response received',
          legalResponse,
          timestamp: new Date()
        }

        console.log('[Page] Adding assistant message:', assistantMessage)

        setConversations(prev => prev.map(c =>
          c.id === currentConversationId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        ))
      } else {
        const errorMsg = result.error || 'Failed to get response from LexAssist'
        console.error('[Page] Error from agent:', errorMsg, result)
        setError(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      console.error('[Page] Exception during agent call:', err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('lexassist_dark_mode', String(newMode))
  }

  // Welcome Screen
  if (screen === 'welcome') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'} flex items-center justify-center p-4`}>
        <Card className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-900'}`}>
                <FaBalanceScale className="text-5xl text-yellow-400" />
              </div>
            </div>
            <CardTitle className={`text-4xl font-serif ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              LexAssist AI
            </CardTitle>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your Comprehensive Legal Research Assistant for Indian Criminal & Corporate Law
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Select Your User Type
              </h3>
              <RadioGroup value={userType || ''} onValueChange={(value) => setUserType(value as UserType)}>
                <div className="space-y-3">
                  {[
                    { value: 'lawyer', label: 'Lawyer', icon: FaBriefcase, desc: 'Legal practitioner' },
                    { value: 'judge', label: 'Judge', icon: FaGavel, desc: 'Judicial officer' },
                    { value: 'student', label: 'Student', icon: FaGraduationCap, desc: 'Law student' },
                    { value: 'paralegal', label: 'Paralegal', icon: FaFileAlt, desc: 'Legal assistant' },
                    { value: 'corporate_counsel', label: 'Corporate Counsel', icon: FaUserTie, desc: 'In-house legal' }
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <div key={value} className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userType === value
                        ? darkMode
                          ? 'border-yellow-500 bg-blue-900/30'
                          : 'border-blue-700 bg-blue-50'
                        : darkMode
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                          : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => setUserType(value as UserType)}>
                      <RadioGroupItem value={value} id={value} />
                      <Icon className={`text-2xl ${userType === value ? 'text-yellow-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <Label htmlFor={value} className="flex-1 cursor-pointer">
                        <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Capabilities:</h4>
              <ul className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• Comprehensive legal research and case analysis</li>
                <li>• Document drafting and review assistance</li>
                <li>• Procedural guidance and strategic advice</li>
                <li>• Indian Criminal Law and Corporate Law expertise</li>
              </ul>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!userType}
              className={`w-full py-6 text-lg font-semibold ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-900 hover:bg-blue-800'}`}
            >
              Continue to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Chat Interface
  return (
    <div className={`h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
        <div className="p-4 flex items-center space-x-2">
          <FaBalanceScale className="text-2xl text-yellow-500" />
          <span className={`font-serif text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>LexAssist</span>
        </div>

        <div className="px-4 pb-4">
          <Button onClick={handleNewChat} className="w-full bg-blue-700 hover:bg-blue-600">
            <FaPlus className="mr-2" /> New Chat
          </Button>
        </div>

        <Separator className={darkMode ? 'bg-gray-700' : ''} />

        <div className={`px-4 py-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <div className="flex items-center space-x-2">
            <FaUserTie className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm font-semibold capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {userType?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentConversationId === conv.id
                    ? darkMode ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-900'
                    : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm truncate">{conv.title}</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {conv.messages.length} messages
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator className={darkMode ? 'bg-gray-700' : ''} />

        <div className="p-4">
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            className="w-full"
          >
            {darkMode ? <FaSun className="mr-2" /> : <FaMoon className="mr-2" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`h-16 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-6`}>
          <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentConversation?.title || 'LexAssist AI'}
          </h1>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={darkMode ? 'text-yellow-400 border-yellow-400' : 'text-blue-700 border-blue-700'}>
              <FaBalanceScale className="mr-1" /> Legal Research Assistant
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {currentConversation?.messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'user' ? (
                  <div className={`max-w-2xl p-4 rounded-lg ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-900 text-white'}`}>
                    {message.content}
                  </div>
                ) : (
                  <div className="max-w-3xl w-full space-y-4">
                    {message.legalResponse ? (
                      <LegalResponseDisplay response={message.legalResponse} darkMode={darkMode} />
                    ) : (
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {message.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <FaSpinner className="animate-spin text-blue-600" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-2xl p-4 rounded-lg bg-red-100 text-red-900 border border-red-300">
                  <div className="flex items-center space-x-2">
                    <FaExclamationCircle />
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend('Draft a legal notice for breach of contract')}
                disabled={loading}
                className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Draft Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend('Explain the concept of anticipatory bail')}
                disabled={loading}
                className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Explain Case
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend('What is the procedure for filing a PIL?')}
                disabled={loading}
                className={darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Procedural Guide
              </Button>
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask any legal question..."
                className={`flex-1 resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}`}
                rows={2}
                maxLength={500}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="bg-blue-700 hover:bg-blue-600 px-6"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              </Button>
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-right`}>
              {input.length}/500
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Legal Response Display Component
function LegalResponseDisplay({ response, darkMode }: { response: LegalResponse; darkMode: boolean }) {
  return (
    <div className={`space-y-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* Summary */}
      <Card className={`${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <FaBookOpen className="text-yellow-600" />
            <CardTitle className={`text-lg ${darkMode ? 'text-yellow-400' : 'text-yellow-900'}`}>Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={darkMode ? 'text-yellow-100' : 'text-yellow-900'}>{response.summary}</p>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <ExpandableSection title="Detailed Analysis" icon={FaGavel} darkMode={darkMode}>
        <div className="whitespace-pre-line">{response.detailed_analysis}</div>
      </ExpandableSection>

      {/* Case Law */}
      {response.case_law && response.case_law.length > 0 && (
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FaLandmark className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Case Law</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {response.case_law.map((caseCitation, idx) => (
              <CaseLawCard key={idx} citation={caseCitation} darkMode={darkMode} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statutory Provisions */}
      {response.statutory_provisions && (
        <ExpandableSection title="Statutory Provisions" icon={FaFileAlt} darkMode={darkMode}>
          <div className="whitespace-pre-line">{response.statutory_provisions}</div>
        </ExpandableSection>
      )}

      {/* Practical Guidance */}
      {response.practical_guidance && (
        <ExpandableSection title="Practical Guidance" icon={FaBriefcase} darkMode={darkMode}>
          <div className="whitespace-pre-line">{response.practical_guidance}</div>
        </ExpandableSection>
      )}

      {/* Disclaimer */}
      {response.disclaimer && (
        <div className={`p-3 rounded-lg text-xs ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
          <div className="flex items-start space-x-2">
            <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
            <div>{response.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Expandable Section Component
function ExpandableSection({
  title,
  icon: Icon,
  children,
  darkMode
}: {
  title: string
  icon: any
  children: React.ReactNode
  darkMode: boolean
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</CardTitle>
              </div>
              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Case Law Card Component
function CaseLawCard({ citation, darkMode }: { citation: string; darkMode: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for iframe
      const textArea = document.createElement('textarea')
      textArea.value = citation
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{citation}</div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className={`ml-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
        >
          {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
        </Button>
      </div>
    </div>
  )
}
