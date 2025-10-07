'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
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

function ChatContent() {
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
  const [conversationContextMenu, setConversationContextMenu] = useState<{ x: number; y: number; conversationId: string; otherUserId: string } | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  
  // Ref for the messages container to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to scroll to bottom of messages instantly
  const scrollToBottomInstant = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  };

  // Function to check if user is near bottom of messages
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    const isNear = container.scrollTop + container.clientHeight + threshold >= container.scrollHeight;
    return isNear;
  };

  // Auto-scroll when messages change, but only if user is near bottom
  useEffect(() => {
    // Always scroll to bottom when loading messages initially or switching conversations
    if (isLoadingMessages) return;
    
    // For new messages, only auto-scroll if user is near bottom or it's their own message
    const shouldAutoScroll = isNearBottom() || messages.length === 0;
    
    if (shouldAutoScroll) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoadingMessages]);

  // Scroll to bottom when conversation is selected (after messages are loaded)
  useEffect(() => {
    if (selectedConversation && !isLoadingMessages && messages.length > 0) {
      // Scroll to bottom when switching conversations
      setTimeout(scrollToBottomInstant, 50);
    }
  }, [selectedConversation, isLoadingMessages, messages.length]);

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
    const handleGlobalClick = () => {
      handleClickOutside();
      setConversationContextMenu(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setConversationContextMenu(null);
      }
    };

    if (contextMenu || conversationContextMenu) {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu, conversationContextMenu]);

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

  // Realtime subscription for conversations and messages to update sidebar
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async () => {
          // Refresh conversations when any conversation is created/updated
          const { data, error } = await supabase.rpc('get_user_conversations');
          if (!error && data) {
            setConversations(data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async () => {
          // Refresh conversations when new messages are sent (updates last_message info)
          const { data, error } = await supabase.rpc('get_user_conversations');
          if (!error && data) {
            setConversations(data);
          }
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [user]);

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

    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation || !user) return;

    console.log('Setting up realtime subscription for conversation:', selectedConversation);
    console.log('🔍 Setting up DELETE event listener for filter:', `conversation_id=eq.${selectedConversation}`);

    // Subscribe to messages table changes for the current conversation
    const messagesChannel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        async (payload) => {
          console.log('🔥 New message received via realtime:', payload);
          
          // Extract message data from payload
          const newMessageData = payload.new;
          if (!newMessageData?.id) {
            console.error('❌ Invalid message payload - missing ID:', payload);
            return;
          }
          
          // Get sender info from profiles table
          let senderName = 'Unknown User';
          if (newMessageData.sender_id) {
            try {
              const { data: senderProfile, error: profileError } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('user_id', newMessageData.sender_id)
                .single();
              
              if (!profileError && senderProfile) {
                senderName = senderProfile.display_name;
              } else {
                console.warn('⚠️ Could not fetch sender profile:', profileError);
              }
            } catch (error) {
              console.warn('⚠️ Error fetching sender profile:', error);
            }
          }
          
          // Create message object from payload
          const newMessage: Message = {
            message_id: newMessageData.id,
            sender_id: newMessageData.sender_id,
            sender_name: senderName,
            content: newMessageData.content,
            created_at: newMessageData.created_at,
            is_edited: newMessageData.is_edited || false
          };
          
          console.log('✅ Processing realtime message:', newMessage);
          
          setMessages(prevMessages => {
            // If this is our own message, replace any optimistic message
            if (newMessageData.sender_id === user?.id) {
              console.log('📤 Own message received, replacing optimistic message');
              // Remove any temporary messages and add the real one
              const withoutTemp = prevMessages.filter(msg => !msg.message_id.startsWith('temp-'));
              // Check if the real message already exists
              if (withoutTemp.some(msg => msg.message_id === newMessage.message_id)) {
                console.log('⚠️ Message already exists, skipping duplicate');
                return withoutTemp;
              }
              return [...withoutTemp, newMessage];
            } else {
              console.log('📥 Message from other user received');
              // For messages from others, just check for duplicates and add
              if (prevMessages.some(msg => msg.message_id === newMessage.message_id)) {
                console.log('⚠️ Message already exists, skipping duplicate');
                return prevMessages;
              }
              return [...prevMessages, newMessage];
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🗑️🗑️🗑️ DELETE EVENT RECEIVED!!! 🗑️🗑️🗑️');
          console.log('🗑️ payload.old:', payload.old);
          
          const deletedMessageId = payload.old?.id;
          
          if (!deletedMessageId) {
            console.error('❌ Invalid delete payload - missing message ID:', payload);
            return;
          }
          
          console.log('🗑️ Attempting to remove message with ID:', deletedMessageId);
          
          // Remove deleted message from state (only if it exists in current conversation)
          setMessages(prevMessages => {
            const messageToDelete = prevMessages.find(msg => msg.message_id === deletedMessageId);
            
            if (!messageToDelete) {
              console.log('⚠️ Message not found in current conversation, ignoring DELETE event');
              return prevMessages;
            }
            
            console.log('🔍 Found message to delete:', messageToDelete.content.substring(0, 50) + '...');
            
            const filtered = prevMessages.filter(msg => msg.message_id !== deletedMessageId);
            console.log('📊 Messages before delete:', prevMessages.length, 'after delete:', filtered.length);
            console.log('✅ Successfully removed message from UI');
            
            return filtered;
          });
        }
      )
      .subscribe((status) => {
        console.log('🔗 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Realtime subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime subscription closed');
        }
      });

    // Cleanup subscription when conversation changes or component unmounts
    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedConversation, user]);

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSendingMessage) return;
    
    console.log('Sending message:', newMessage.trim(), 'to conversation:', selectedConversation);
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setIsSendingMessage(true);
    
    try {
      const { data, error } = await supabase.rpc('send_message', {
        conversation_id: selectedConversation,
        message_content: messageContent
      });
      
      if (error) {
        console.error('Error sending message:', error);
        // Restore the message in input if there was an error
        setNewMessage(messageContent);
        return;
      }

      console.log('Message sent successfully:', data);
      
      // Optimistically add the message to UI immediately
      const optimisticMessage = {
        message_id: `temp-${Date.now()}`, // Temporary ID
        content: messageContent,
        created_at: new Date().toISOString(),
        is_edited: false,
        sender_id: user?.id || '',
        sender_name: user?.user_metadata?.full_name || user?.email || 'You'
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      // Restore the message in input if there was an error
      setNewMessage(messageContent);
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
      console.log('🗑️ Attempting to delete message:', messageId);
      setContextMenu(null); // Close context menu immediately
      
      // Optimistically remove the message from UI
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.message_id === messageId 
            ? { ...msg, content: 'Deleting...', is_edited: true }
            : msg
        )
      );
      
      // First, let's test if the realtime subscription is working by adding a test log
      console.log('🔍 Current realtime subscription status for conversation:', selectedConversation);
      
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id) // Extra security check
        .select(); // Add select() to get the deleted row data back
      
      console.log('🗑️ Delete result:', { data, error });
      console.log('🗑️ Deleted row data:', data);
      
      if (error) {
        console.error('❌ Error deleting message:', error);
        
        // Restore the original message on error
        setMessages(prevMessages => {
          // We need to refetch the message content since we modified it
          // For now, just remove the "Deleting..." state and let realtime handle it
          return prevMessages.filter(msg => msg.message_id !== messageId);
        });
        
        alert('Failed to delete message. Please try again.');
        return;
      }

      console.log('✅ Message deleted successfully from database');
      
      // Add a timeout to check if realtime DELETE event was received
      setTimeout(() => {
        setMessages(prevMessages => {
          const messageStillExists = prevMessages.some(msg => msg.message_id === messageId);
          if (messageStillExists) {
            console.warn('⚠️ Realtime DELETE event not received, manually removing message from UI');
            return prevMessages.filter(msg => msg.message_id !== messageId);
          }
          return prevMessages;
        });
      }, 2000); // Wait 2 seconds for realtime event
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      
      // Restore message on unexpected error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.message_id !== messageId)
      );
      
      alert('Something went wrong. Please try again.');
    }
  };

  // Close context menu when clicking outside
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  // Handle right-click on conversation
  const handleConversationRightClick = (e: React.MouseEvent, conversationId: string, otherUserId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversationId,
      otherUserId
    });
  };

  // Check if a user is blocked
  const checkIfBlocked = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_user_blocked', {
        user_to_check: userId
      });
      
      if (error) {
        console.error('Error checking block status:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Load blocked users on mount
  useEffect(() => {
    const loadBlockedUsers = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_blocked_users');
        
        if (error) {
          console.error('Error loading blocked users:', error);
          return;
        }
        
        const blocked = new Set<string>(
          data?.map((b: { blocked_user_id: string; blocked_user_name: string; blocked_at: string; block_id: string }) => b.blocked_user_id) || []
        );
        setBlockedUsers(blocked);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    if (user) {
      loadBlockedUsers();
    }
  }, [user]);

  // Block a user
  const blockUser = async (userId: string) => {
    try {
      setConversationContextMenu(null);
      
      const { data, error } = await supabase.rpc('block_user', {
        user_to_block: userId
      });
      
      if (error) {
        console.error('Error blocking user:', error);
        alert('Failed to block user. Please try again.');
        return;
      }
      
      // Update blocked users set
      setBlockedUsers(prev => new Set([...prev, userId]));
      
      // Refresh conversations to remove the blocked user's conversation
      const { data: convData, error: convError } = await supabase.rpc('get_user_conversations');
      if (!convError && convData) {
        setConversations(convData);
        
        // If the blocked user's conversation was selected, deselect it
        if (selectedConversation && conversations.find(c => c.conversation_id === selectedConversation)?.other_user_id === userId) {
          setSelectedConversation(null);
        }
      }
      
      alert('User blocked successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to block user. Please try again.');
    }
  };

  // Unblock a user
  const unblockUser = async (userId: string) => {
    try {
      setConversationContextMenu(null);
      
      const { data, error } = await supabase.rpc('unblock_user', {
        user_to_unblock: userId
      });
      
      if (error) {
        console.error('Error unblocking user:', error);
        alert('Failed to unblock user. Please try again.');
        return;
      }
      
      // Update blocked users set
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      // Refresh conversations to show the unblocked user's conversation
      const { data: convData, error: convError } = await supabase.rpc('get_user_conversations');
      if (!convError && convData) {
        setConversations(convData);
      }
      
      alert('User unblocked successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to unblock user. Please try again.');
    }
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
                    onContextMenu={(e) => handleConversationRightClick(e, conversation.conversation_id, conversation.other_user_id)}
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
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    {/* <div className="text-white/60">Loading messages...</div> */}
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
                {/* Invisible div to serve as scroll target */}
                <div ref={messagesEndRef} />
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

      {/* Conversation Context Menu */}
      {conversationContextMenu && (
        <div 
          className="fixed bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 py-2 min-w-40"
          style={{ 
            left: conversationContextMenu.x, 
            top: conversationContextMenu.y,
          }}
        >
          {blockedUsers.has(conversationContextMenu.otherUserId) ? (
            <button
              onClick={() => unblockUser(conversationContextMenu.otherUserId)}
              className="w-full px-4 py-2 text-left text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>Unblock User</span>
            </button>
          ) : (
            <button
              onClick={() => blockUser(conversationContextMenu.otherUserId)}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Block User</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}