'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  last_message_sender_id: string;
}

interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_edited: boolean;
}

export default function Chat() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Hide footer on chat page
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = 'none';
    }
    
    // Show footer again when component unmounts
    return () => {
      if (footer) {
        footer.style.display = 'block';
      }
    };
  }, []);

  // Close context menu on click outside or escape
  useEffect(() => {
    const handleGlobalClick = () => handleClickOutside();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_conversations');
        
        if (error) {
          console.error('Error fetching conversations:', error);
          return;
        }

        setConversations(data || []);
        
        // If there's a conversation parameter, select it
        if (conversationParam && data?.some((conv: Conversation) => conv.conversation_id === conversationParam)) {
          setSelectedConversation(conversationParam);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setConversationsLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user, conversationParam]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }
      
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase.rpc('get_conversation_messages', {
          conv_id: selectedConversation,
          limit_count: 50,
          offset_count: 0
        });
        
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        setMessages((data || []).reverse()); // Reverse to show oldest first
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSendingMessage) return;
    
    setIsSendingMessage(true);
    try {
      const { data, error } = await supabase.rpc('send_message', {
        conversation_id: selectedConversation,
        message_content: newMessage.trim()
      });
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Refresh messages after sending
      const { data: messagesData, error: messagesError } = await supabase.rpc('get_conversation_messages', {
        conv_id: selectedConversation,
        limit_count: 50,
        offset_count: 0
      });
      
      if (!messagesError) {
        setMessages((messagesData || []).reverse());
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRightClick = (e: React.MouseEvent, messageId: string, senderId: string) => {
    // Only allow right-click on own messages
    if (senderId !== user?.id) return;
    
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: messageId
    });
  };

  const deleteMessage = async (messageId: string) => {
    try {
      console.log('Attempting to delete message:', messageId);
      
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id); // Extra security check
      
      console.log('Delete result:', { data, error });
      
      if (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message. Please try again.');
        return;
      }

      console.log('Message deleted successfully, refreshing messages...');

      // Remove the message from local state immediately for better UX
      setMessages(prevMessages => prevMessages.filter(msg => msg.message_id !== messageId));

      // Also refresh from server to stay in sync
      if (selectedConversation) {
        const { data: messagesData, error: messagesError } = await supabase.rpc('get_conversation_messages', {
          conv_id: selectedConversation,
          limit_count: 50,
          offset_count: 0
        });
        
        if (!messagesError) {
          setMessages((messagesData || []).reverse());
        } else {
          console.error('Error refreshing messages:', messagesError);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setContextMenu(null);
    }
  };

  // Close context menu when clicking outside
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) : '?';
  };

  if (loading || conversationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedConversationData = conversations.find(conv => conv.conversation_id === selectedConversation);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 z-50 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="text-xl sm:text-2xl font-bold text-white transition-colors group flex-shrink-0"
            >
              <span className="group-hover:text-red-400 transition-colors">RU</span><span className="text-red-400">Friends</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => router.push(`/dashboard/`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push(`/find-friends`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Find Friends
              </button>
              <button
                onClick={() => router.push(`/posts`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Posts
              </button>
              <button
                onClick={() => router.push(`/chat`)}
                className="text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Chat
              </button>
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => router.push(`/settings/`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Settings
              </button>
            </div>

            {/* Desktop User Info & Sign Out */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-white/80 text-sm max-w-48 truncate">
                {user.user_metadata?.full_name || user.email}
              </div>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-2">
              <button
                onClick={() => {
                  router.push(`/dashboard/`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  router.push(`/find-friends`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Find Friends
              </button>
              <button
                onClick={() => {
                  router.push(`/posts`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Posts
              </button>
              <button
                onClick={() => {
                  router.push(`/chat`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white font-medium px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Chat
              </button>
              <button
                onClick={() => {
                  router.push(`/profile/${user.id}`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  router.push(`/settings/`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Settings
              </button>
              
              {/* Mobile User Info */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="px-4 py-2 text-white/80 text-sm">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <button
                  onClick={signOut}
                  className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Chat Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Conversations */}
        <div className="w-85 bg-black/30 backdrop-blur-md border-r border-white/10 flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Messages</h2>
              <button
                onClick={() => router.push('/find-friends')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Start new chat"
              >
                <svg className="w-5 h-5 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No conversations</h3>
                <p className="text-xs text-white/60 mb-4">Start chatting with friends!</p>
                <button
                  onClick={() => router.push('/find-friends')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="py-3 px-3">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    onClick={() => setSelectedConversation(conversation.conversation_id)}
                    className={`w-full p-4 hover:bg-white/5 rounded-lg transition-colors text-left group mb-2 ${
                      selectedConversation === conversation.conversation_id ? 'bg-white/10 border border-white/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {conversation.other_user_name ? conversation.other_user_name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium text-sm truncate group-hover:text-red-300 transition-colors">
                            {conversation.other_user_name || 'Unknown User'}
                          </h3>
                          <span className="text-white/40 text-xs flex-shrink-0 ml-2">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="text-white/60 text-xs truncate">
                          {conversation.last_message ? (
                            <>
                              {conversation.last_message_sender_id === user.id && (
                                <span className="text-white/40">You: </span>
                              )}
                              {truncateMessage(conversation.last_message, 35)}
                            </>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-white/10 bg-black/10 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {getInitials(selectedConversationData?.other_user_name || '')}
                    </span>
                  </div>
                  <button
                    onClick={() => selectedConversationData?.other_user_id && router.push(`/profile/${selectedConversationData.other_user_id}`)}
                    className="text-white font-medium hover:text-red-300 transition-colors cursor-pointer"
                    disabled={!selectedConversationData?.other_user_id}
                  >
                    {selectedConversationData?.other_user_name}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="text-white/60">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👋</span>
                    </div>
                    <h3 className="text-white font-medium mb-2">Start the conversation!</h3>
                    <p className="text-white/60 text-sm">Send a message to {selectedConversationData?.other_user_name}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-end space-x-2 max-w-sm lg:max-w-md xl:max-w-lg">
                        {message.sender_id !== user.id && (
                          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {getInitials(message.sender_name || '')}
                            </span>
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl break-words max-w-xs sm:max-w-sm md:max-w-md relative ${
                            message.sender_id === user.id
                              ? 'bg-red-500 text-white rounded-br-md cursor-context-menu'
                              : 'bg-white/10 text-white rounded-bl-md'
                          }`}
                          onContextMenu={(e) => handleRightClick(e, message.message_id, message.sender_id)}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user.id ? 'text-white/70' : 'text-white/50'
                          }`}>
                            {formatTime(message.created_at)}
                            {message.is_edited && ' (edited)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-white/10 bg-black/5 backdrop-blur-md flex-shrink-0">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedConversationData?.other_user_name}...`}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-red-400 focus:bg-white/15 transition-colors"
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {isSendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Welcome/Empty State */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900/50 via-red-900/20 to-slate-900/50">
              <div className="text-center max-w-md px-6">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Welcome to RUFriends Chat</h2>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Select a conversation from the sidebar to start chatting, or find new friends to connect with.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/find-friends')}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Find Friends
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium border border-white/20"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 py-2 min-w-32"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)' // Center horizontally and position above cursor
          }}
        >
          <button
            onClick={() => deleteMessage(contextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Message</span>
          </button>
        </div>
      )}

    </div>
  );
}