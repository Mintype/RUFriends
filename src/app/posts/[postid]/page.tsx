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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [userProfile, setUserProfile] = useState<{ display_name: string } | null>(null);

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

  const fetchReplies = useCallback(async () => {
    if (!postId) return;
    
    setRepliesLoading(true);
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error);
        return;
      }

      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setRepliesLoading(false);
    }
  }, [postId]);

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

    setIsCreatingReply(true);
    try {
      const { error } = await supabase
        .from('replies')
        .insert({
          post_id: post.id,
          content: newReplyContent.trim()
        });

      if (error) {
        console.error('Error creating reply:', error);
        alert('Error creating reply. Please try again.');
        return;
      }

      setNewReplyContent('');
      fetchReplies(); // Refresh replies
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Error creating reply. Please try again.');
    } finally {
      setIsCreatingReply(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user?.id) {
      fetchUserProfile();
      fetchPost();
      fetchReplies();
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-3">{post.title}</h1>
            <p className="text-white/70 text-sm">
              By {post.username} • {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
            </p>
          </div>
          
          <div className="text-white/90 mb-6 whitespace-pre-wrap leading-relaxed">{post.content}</div>
          
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
              <span>{replies.length} replies</span>
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
                <span className={`text-xs ${newReplyContent.length > 1000 ? 'text-red-400' : 'text-white/50'}`}>
                  {newReplyContent.length}/1000
                </span>
              </div>
              <textarea
                value={newReplyContent}
                onChange={(e) => setNewReplyContent(e.target.value.slice(0, 1000))}
                placeholder="Write your reply..."
                rows={3}
                maxLength={1000}
                className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                  newReplyContent.length > 1000 
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
                  newReplyContent.length > 1000
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
            Replies ({replies.length})
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
                    <span className="text-white font-medium">{reply.username}</span>
                    <span className="text-white/50 text-sm">
                      {new Date(reply.created_at).toLocaleDateString()} at {new Date(reply.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-white/90 whitespace-pre-wrap">{reply.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-white">RU<span className="text-red-400">Friends</span></h3>
              <span className="text-white/40">•</span>
              <span className="text-white/60 text-sm">Connecting Scarlet Knights since 2025</span>
            </div>
            <div className="flex space-x-8 text-sm">
              <Link 
                href="/privacy"
                className="text-white/60 hover:text-red-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <a 
                href="https://github.com/Mintype/RUFriends" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-white/60 hover:text-red-400 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Open Source</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}