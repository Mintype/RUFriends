'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface Post {
  id: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
  user_has_liked?: boolean;
  replies_count?: number;
}

interface Profile {
  display_name: string;
}

export default function Posts() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'top'>('newest');
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

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

  const fetchPosts = useCallback(async (page = 0, append = false) => {
    if (!user) return;
    
    if (page === 0) {
      setPostsLoading(true);
      setPosts([]);
      setCurrentPage(0);
      setHasMorePosts(true);
    } else {
      setLoadingMorePosts(true);
    }
    
    try {
      const pageSize = 10;
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      // Build the query with filters
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          username,
          title,
          content,
          created_at,
          updated_at
        `);
      
      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let cutoffDate: Date;
        
        switch (dateFilter) {
          case 'day':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }
        
        query = query.gte('created_at', cutoffDate.toISOString());
      }
      
      // Apply sorting and pagination
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      }
      // Note: 'top' sorting will be handled after we get like counts
      
      query = query.range(from, to);
      
      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (postsData) {
        // For each post, check if the current user has liked it and get actual likes count
        const postsWithLikeStatus = await Promise.all(
          postsData.map(async (post) => {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();

            // Get actual likes count from post_likes table
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Get replies count
            const { count: repliesCount } = await supabase
              .from('replies')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              likes: likesCount || 0, // Override with actual count from post_likes table
              user_has_liked: !!likeData,
              replies_count: repliesCount || 0
            };
          })
        );

        // Apply 'top' sorting after getting like counts
        let sortedPosts = postsWithLikeStatus;
        if (sortBy === 'top') {
          sortedPosts = postsWithLikeStatus.sort((a, b) => b.likes - a.likes);
        }

        if (append) {
          setPosts(prev => [...prev, ...sortedPosts]);
        } else {
          setPosts(sortedPosts);
        }

        // Check if there are more posts to load
        if (postsData.length < pageSize) {
          setHasMorePosts(false);
        }

        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
      setLoadingMorePosts(false);
    }
  }, [user?.id, searchQuery, sortBy, dateFilter]);

  const loadMorePosts = () => {
    if (!loadingMorePosts && hasMorePosts) {
      fetchPosts(currentPage + 1, true);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    setHasMorePosts(true);
    fetchPosts(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setDateFilter('all');
    setCurrentPage(0);
    setHasMorePosts(true);
  };

  const createPost = async () => {
    if (!user || !userProfile || !newPostTitle.trim() || !newPostContent.trim()) return;

    setIsCreatingPost(true);
    try {
      // Send user data - database will validate it matches authenticated user
      const { error } = await supabase
        .from('posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPostContent.trim()
        });

      if (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
        return;
      }

      // Clear form and refresh posts
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreatePost(false);
      fetchPosts(0);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking post:', error);
          return;
        }

        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes - 1, user_has_liked: false }
              : post
          )
        );
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) {
          console.error('Error liking post:', error);
          return;
        }

        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, likes: post.likes + 1, user_has_liked: true }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user?.id) {
      fetchUserProfile();
      fetchPosts(0);
    }
  }, [user?.id, loading, router, fetchUserProfile, fetchPosts]);

  // Auto-search when filters change
  useEffect(() => {
    if (user?.id) {
      fetchPosts(0);
    }
  }, [searchQuery, sortBy, dateFilter, fetchPosts, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Posts</h1>
          
          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 border border-white/20">
            {/* Search Bar - Top Row */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Search Posts</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by post title..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleSearch}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
            
            {/* Filters and Actions - Bottom Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'top')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="newest" className="bg-gray-800">Newest</option>
                  <option value="oldest" className="bg-gray-800">Oldest</option>
                  <option value="top" className="bg-gray-800">Most Liked</option>
                </select>
              </div>
              
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'day' | 'week' | 'month' | 'all')}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all" className="bg-gray-800">All Time</option>
                  <option value="day" className="bg-gray-800">Past Day</option>
                  <option value="week" className="bg-gray-800">Past Week</option>
                  <option value="month" className="bg-gray-800">Past Month</option>
                </select>
              </div>
              
              {/* Clear Filters Button */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">Actions</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearFilters}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Create Post Button */}
          <button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-6 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Post</span>
          </button>

          {/* Create Post Form */}
          {showCreatePost && (
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Post</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-white">Title</label>
                    <span className={`text-xs ${newPostTitle.length > 200 ? 'text-red-400' : 'text-white/50'}`}>
                      {newPostTitle.length}/200
                    </span>
                  </div>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value.slice(0, 200))}
                    placeholder="Enter post title..."
                    maxLength={200}
                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                      newPostTitle.length > 200 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/20 focus:ring-red-500'
                    }`}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-white">Content</label>
                    <span className={`text-xs ${newPostContent.length > 5000 ? 'text-red-400' : 'text-white/50'}`}>
                      {newPostContent.length}/5000
                    </span>
                  </div>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value.slice(0, 5000))}
                    placeholder="What's on your mind?"
                    rows={4}
                    maxLength={5000}
                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 resize-none ${
                      newPostContent.length > 5000 
                        ? 'border-red-400 focus:ring-red-500' 
                        : 'border-white/20 focus:ring-red-500'
                    }`}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={createPost}
                    disabled={
                      isCreatingPost || 
                      !newPostTitle.trim() || 
                      !newPostContent.trim() ||
                      newPostTitle.length > 200 ||
                      newPostContent.length > 5000
                    }
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isCreatingPost ? 'Creating...' : 'Post'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPostTitle('');
                      setNewPostContent('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts List */}
        {postsLoading ? (
          <div className="text-center text-white py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-white/70 py-8">
            <p>No posts yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
                {/* Clickable post content */}
                <div 
                  className="p-6 cursor-pointer transition-colors"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2 overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                        {post.title}
                      </h3>
                      <p className="text-white/70 text-sm">
                        By {post.username} • {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-white/90 mb-4 whitespace-pre-wrap overflow-hidden"
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 6,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden'
                       }}>
                    {post.content}
                  </div>
                </div>
                
                {/* Action buttons (not clickable to post detail) */}
                <div className="px-6 pb-6"
                     onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-6 text-white/70">
                    <button
                      onClick={() => toggleLike(post.id, post.user_has_liked || false)}
                      className={`flex items-center space-x-2 hover:text-red-400 transition-colors ${
                        post.user_has_liked ? 'text-red-400' : ''
                      }`}
                    >
                      <svg className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} fill={post.user_has_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => router.push(`/posts/${post.id}`)}
                      className="flex items-center space-x-2 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{post.replies_count} replies</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMorePosts && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMorePosts}
                  className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors border border-white/20"
                >
                  {loadingMorePosts ? (
                    <div className="flex items-center space-x-2">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Loading more posts...</span>
                    </div>
                  ) : (
                    'Load More Posts'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Filter Status Display */}
        {(searchQuery || dateFilter !== 'all') && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-white/70 text-sm">
              <span className="font-medium">Active filters:</span>
              {searchQuery && <span className="ml-2 px-2 py-1 bg-red-500/20 rounded text-red-300">Search: &quot;{searchQuery}&quot;</span>}
              {dateFilter !== 'all' && <span className="ml-2 px-2 py-1 bg-green-500/20 rounded text-green-300">Past {dateFilter}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}