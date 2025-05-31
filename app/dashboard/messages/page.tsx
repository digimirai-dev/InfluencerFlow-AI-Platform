'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare,
  Send,
  Search,
  User,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  created_at: string
  read_at: string | null
  content: string
  sender: { id: string; full_name: string; avatar_url: string; user_type: string }
  recipient: { id: string; full_name: string; avatar_url: string; user_type: string }
}

interface Conversation {
  participant: { id: string; full_name: string; avatar_url: string; user_type: string }
  messages: Message[]
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const { userProfile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (userProfile?.id) {
      fetchConversations()
    }
  }, [userProfile])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      
      // Handle demo user with mock data
      if (userProfile?.id === 'demo-user-id') {
        const mockConversations: Conversation[] = [
          {
            participant: {
              id: 'creator-1',
              full_name: 'Sarah Lifestyle',
              avatar_url: '',
              user_type: 'creator'
            },
            messages: [
              {
                id: 'msg-1',
                created_at: '2024-01-15T10:30:00Z',
                read_at: null,
                content: 'Hi! I\'m interested in your summer fashion campaign. Could we discuss the details?',
                sender: { id: 'creator-1', full_name: 'Sarah Lifestyle', avatar_url: '', user_type: 'creator' },
                recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
              },
              {
                id: 'msg-2',
                created_at: '2024-01-15T11:00:00Z',
                read_at: '2024-01-15T11:05:00Z',
                content: 'Absolutely! I\'d love to work with you. What kind of content are you looking for?',
                sender: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' },
                recipient: { id: 'creator-1', full_name: 'Sarah Lifestyle', avatar_url: '', user_type: 'creator' }
              }
            ],
            lastMessage: {
              id: 'msg-1',
              created_at: '2024-01-15T10:30:00Z',
              read_at: null,
              content: 'Hi! I\'m interested in your summer fashion campaign. Could we discuss the details?',
              sender: { id: 'creator-1', full_name: 'Sarah Lifestyle', avatar_url: '', user_type: 'creator' },
              recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
            },
            unreadCount: 1
          },
          {
            participant: {
              id: 'creator-2',
              full_name: 'Mike Fitness Pro',
              avatar_url: '',
              user_type: 'creator'
            },
            messages: [
              {
                id: 'msg-3',
                created_at: '2024-01-14T15:20:00Z',
                read_at: '2024-01-14T15:25:00Z',
                content: 'Thanks for considering me for the tech product launch! When do you need the content delivered?',
                sender: { id: 'creator-2', full_name: 'Mike Fitness Pro', avatar_url: '', user_type: 'creator' },
                recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
              }
            ],
            lastMessage: {
              id: 'msg-3',
              created_at: '2024-01-14T15:20:00Z',
              read_at: '2024-01-14T15:25:00Z',
              content: 'Thanks for considering me for the tech product launch! When do you need the content delivered?',
              sender: { id: 'creator-2', full_name: 'Mike Fitness Pro', avatar_url: '', user_type: 'creator' },
              recipient: { id: 'demo-user-id', full_name: 'Demo Brand User', avatar_url: '', user_type: 'brand' }
            },
            unreadCount: 0
          }
        ]
        setConversations(mockConversations)
        setSelectedConversation(mockConversations[0])
        setLoading(false)
        return
      }

      const response = await fetch(`/api/messages?userId=${userProfile?.id}`)
      const data = await response.json()
      setConversations(data || [])
      if (data && data.length > 0) {
        setSelectedConversation(data[0])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: selectedConversation.participant.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // Refresh conversations
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.participant.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 h-[calc(100vh-120px)]">
      <div className="flex h-full space-x-6">
        {/* Conversations List */}
        <div className="w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </CardTitle>
              <CardDescription>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.participant.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation?.participant.id === conversation.participant.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.participant.full_name}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No conversations match your search' : 'Start a conversation with a creator'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.participant.full_name}</CardTitle>
                      <CardDescription className="capitalize">
                        {selectedConversation.participant.user_type}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => {
                    const isFromUser = message.sender.id === userProfile.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromUser
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${isFromUser ? 'text-blue-100' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                            {isFromUser && message.read_at && (
                              <Clock className="h-3 w-3 text-blue-100" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 