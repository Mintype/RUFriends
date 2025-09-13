'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Post {
  id: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes: number;
  user_has_liked?: boolean;
}

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function PostDetail() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.postid as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [postLoading, setPostLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [repliesPage, setRepliesPage] = useState(0);
  const [totalRepliesCount, setTotalRepliesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);
  
  // Edit post states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  
  // Edit reply states
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [isUpdatingReply, setIsUpdatingReply] = useState(false);
  const [isDeletingReply, setIsDeletingReply] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [user?.id]);

  const fetchPost = useCallback(async () => {
    if (!postId || !user) return;
    
    setPostLoading(true);
    try {
      const { data: postData, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          username,
          title,
          content,
          created_at,
          updated_at
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        return;
      }

      if (postData) {
        // Get likes count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // Check if user has liked
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        setPost({
          ...postData,
          likes: likesCount || 0,
          user_has_liked: !!likeData
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setPostLoading(false);
    }
  }, [postId, user?.id]);

  const fetchTotalRepliesCount = useCallback(async () => {
    if (!postId) return;
    
    try {
      const { count, error } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error fetching replies count:', error);
        return;
      }

      setTotalRepliesCount(count || 0);
    } catch (error) {
      console.error('Error fetching replies count:', error);
    }
  }, [postId]);

  const fetchReplies = useCallback(async (page = 0, append = false) => {
    if (!postId) return;
    
    if (page === 0) {
      setRepliesLoading(true);
      setReplies([]);
      setRepliesPage(0);
      setHasMoreReplies(true);
      // Fetch total count when loading first page
      fetchTotalRepliesCount();
    } else {
      setLoadingMoreReplies(true);
    }
    
    try {
      const pageSize = 5;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('Error fetching replies:', error);
        return;
      }

      const newReplies = data || [];
      
      if (append) {
        setReplies(prev => [...prev, ...newReplies]);
      } else {
        setReplies(newReplies);
      }

      // Check if there are more replies to load
      if (newReplies.length < pageSize) {
        setHasMoreReplies(false);
      }

      setRepliesPage(page);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setRepliesLoading(false);
      setLoadingMoreReplies(false);
    }
  }, [postId, fetchTotalRepliesCount]);

  const loadMoreReplies = () => {
    if (!loadingMoreReplies && hasMoreReplies) {
      fetchReplies(repliesPage + 1, true);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      if (post.user_has_liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        setPost(prev => prev ? {
          ...prev,
          likes: prev.likes - 1,
          user_has_liked: false
        } : null);
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        setPost(prev => prev ? {
          ...prev,
          likes: prev.likes + 1,
          user_has_liked: true
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const createReply = async () => {
    if (!user || !userProfile || !newReplyContent.trim() || !post) return;

    // Validate reply length (1-500 characters)
    if (newReplyContent.trim().length < 1 || newReplyContent.trim().length > 500) {
      alert('Reply must be between 1 and 500 characters');
      return;
    }

    setIsCreatingReply(true);
    try {
      const { error } = await supabase
        .from('replies')
        .insert({
          post_id: post.id,
          content: newReplyContent.trim()
          // user_id and username will be auto-populated by database triggers for security
        });

      if (error) {
        console.error('Error creating reply:', error);
        alert('Error creating reply. Please try again.');
        return;
      }

      setNewReplyContent('');
      setTotalRepliesCount(prev => prev + 1); // Increment total count
      fetchReplies(0); // Refresh replies from the beginning
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Error creating reply. Please try again.');
    } finally {
      setIsCreatingReply(false);
    }
  };

  const startEditing = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
  };

  const updatePost = async () => {
    if (!user || !post || !editTitle.trim() || !editContent.trim()) return;

    setIsUpdatingPost(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: editTitle.trim(),
          content: editContent.trim()
        })
        .eq('id', post.id)
        .eq('user_id', user.id); // Ensure user can only update their own posts

      if (error) {
        console.error('Error updating post:', error);
        alert('Error updating post. Please try again.');
        return;
      }

      // Update local state
      setPost(prev => prev ? {
        ...prev,
        title: editTitle.trim(),
        content: editContent.trim()
      } : null);

      setIsEditing(false);
      setEditTitle('');
      setEditContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post. Please try again.');
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const deletePost = async () => {
    if (!user || !post || isDeletingPost) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;

    setIsDeletingPost(true);

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id); // Extra security check

      if (error) throw error;

      // Navigate back to posts page
      router.push('/posts');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const startEditingReply = (reply: Reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const cancelEditingReply = () => {
    setEditingReplyId(null);
    setEditReplyContent('');
  };

  const updateReply = async (replyId: string) => {
    if (!user || !editReplyContent.trim() || isUpdatingReply) return;

    // Validate reply length (1-500 characters)
    if (editReplyContent.trim().length < 1 || editReplyContent.trim().length > 500) {
      alert('Reply must be between 1 and 500 characters');
      return;
    }

    setIsUpdatingReply(true);
    try {
      const { error } = await supabase
        .from('replies')
        .update({
          content: editReplyContent.trim()
        })
        .eq('id', replyId)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        console.error('Error updating reply:', error);
        alert('Error updating reply. Please try again.');
        return;
      }

      // Update local state
      setReplies(prev => 
        prev.map(reply => 
          reply.id === replyId 
            ? { ...reply, content: editReplyContent.trim() }
            : reply
        )
      );

      setEditingReplyId(null);
      setEditReplyContent('');
    } catch (error) {
      console.error('Error updating reply:', error);
      alert('Error updating reply. Please try again.');
    } finally {
      setIsUpdatingReply(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!user || isDeletingReply) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this reply? This action cannot be undone.');
    if (!confirmDelete) return;

    setIsDeletingReply(true);

    try {
      const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', user.id); // Extra security check

      if (error) throw error;

      // Remove from local state
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      setTotalRepliesCount(prev => prev - 1); // Decrement total count
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Failed to delete reply');
    } finally {
      setIsDeletingReply(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user?.id) {
      fetchUserProfile();
      fetchPost();
      fetchReplies(0);
    }
  }, [user?.id, loading, router, fetchUserProfile, fetchPost, fetchReplies]);

  if (loading || postLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex flex-col">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
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
                className="text-white/70 font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
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
                className="text-white hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Posts
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
                className="block w-full text-left text-white font-medium px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
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

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Posts</span>
        </button>

        {/* Post */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 mb-8">
          {!isEditing ? (
            // Display mode
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-3">{post.title}</h1>
                  <p className="text-white/70 text-sm">
                    By <button
                      onClick={() => router.push(`/profile/${post.user_id}`)}
                      className="text-white/70 hover:text-red-400 transition-colors cursor-pointer font-medium"
                    >
                      {post.username}
                    </button> • {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Edit and Delete buttons - only show if user owns the post */}
                {user && post.user_id === user.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={startEditing}
                      className="flex items-center space-x-2 text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={deletePost}
                      disabled={isDeletingPost}
                      className="flex items-center space-x-2 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm">{isDeletingPost ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-white/90 mb-6 whitespace-pre-wrap leading-relaxed">{post.content}</div>
            </>
          ) : (
            // Edit mode
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white">Title</label>
                  <span className={`text-xs ${editTitle.length > 200 ? 'text-red-400' : 'text-white/50'}`}>
                    {editTitle.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value.slice(0, 200))}
                  placeholder="Enter post title..."
                  maxLength={200}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    editTitle.length > 200 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-red-500'
                  }`}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white">Content</label>
                  <span className={`text-xs ${editContent.length > 5000 ? 'text-red-400' : 'text-white/50'}`}>
                    {editContent.length}/5000
                  </span>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value.slice(0, 5000))}
                  placeholder="What's on your mind?"
                  rows={6}
                  maxLength={5000}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                    editContent.length > 5000 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-red-500'
                  }`}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={updatePost}
                  disabled={
                    isUpdatingPost || 
                    !editTitle.trim() || 
                    !editContent.trim() ||
                    editTitle.length > 200 ||
                    editContent.length > 5000
                  }
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {isUpdatingPost ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-6 text-white/70 border-t border-white/10 pt-4">
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-2 hover:text-red-400 transition-colors ${
                post.user_has_liked ? 'text-red-400' : ''
              }`}
            >
              <svg className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} fill={post.user_has_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes}</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{totalRepliesCount} replies</span>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add a Reply</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-white">Your Reply</label>
                <span className={`text-xs ${newReplyContent.length > 500 ? 'text-red-400' : 'text-white/50'}`}>
                  {newReplyContent.length}/500
                </span>
              </div>
              <textarea
                value={newReplyContent}
                onChange={(e) => setNewReplyContent(e.target.value.slice(0, 500))}
                placeholder="Write your reply..."
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                  newReplyContent.length > 500 
                    ? 'border-red-400 focus:ring-red-500' 
                    : 'border-white/20 focus:ring-red-500'
                }`}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={createReply}
                disabled={
                  isCreatingReply || 
                  !newReplyContent.trim() ||
                  newReplyContent.length > 500
                }
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isCreatingReply ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Replies ({totalRepliesCount})
          </h2>
          
          {repliesLoading ? (
            <div className="text-center text-white py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="mt-2">Loading replies...</p>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center text-white/70 py-8">
              <p>No replies yet. Be the first to reply!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => router.push(`/profile/${reply.user_id}`)}
                        className="text-white font-medium hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {reply.username}
                      </button>
                      <span className="text-white/50 text-sm">
                        {new Date(reply.created_at).toLocaleDateString()} at {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Edit and Delete buttons - only show if user owns the reply */}
                    {user && reply.user_id === user.id && editingReplyId !== reply.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditingReply(reply)}
                          className="flex items-center space-x-1 text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="text-xs">Edit</span>
                        </button>
                        <button
                          onClick={() => deleteReply(reply.id)}
                          disabled={isDeletingReply}
                          className="flex items-center space-x-1 text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-xs">{isDeletingReply ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingReplyId === reply.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-medium text-white">Edit Reply</label>
                          <span className={`text-xs ${editReplyContent.length > 500 ? 'text-red-400' : 'text-white/50'}`}>
                            {editReplyContent.length}/500
                          </span>
                        </div>
                        <textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value.slice(0, 500))}
                          rows={3}
                          maxLength={500}
                          className={`w-full px-3 py-2 bg-white/10 border rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none text-sm ${
                            editReplyContent.length > 500 
                              ? 'border-red-400 focus:ring-red-500' 
                              : 'border-white/20 focus:ring-red-500'
                          }`}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateReply(reply.id)}
                          disabled={
                            isUpdatingReply || 
                            !editReplyContent.trim() ||
                            editReplyContent.length > 500
                          }
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                        >
                          {isUpdatingReply ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditingReply}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="text-white/90 whitespace-pre-wrap">{reply.content}</div>
                  )}
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMoreReplies && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMoreReplies}
                    disabled={loadingMoreReplies}
                    className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/20"
                  >
                    {loadingMoreReplies ? (
                      <div className="flex items-center space-x-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading more replies...</span>
                      </div>
                    ) : (
                      'Load More Replies'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}