'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface Profile {
  classes: string[];
  interests: string[];
  campus: string;
  major: string;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('classes, interests, campus, major')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (data) {
        setProfile({
          classes: data.classes || [],
          interests: data.interests || [],
          campus: data.campus || '',
          major: data.major || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchProfile();
    }
  }, [user, loading, router, fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
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
                className="text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
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
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 mb-8">
          <div className="flex items-center space-x-4 mb-6 sm:justify-start justify-center">
            <div className="hidden sm:flex w-16 h-16 bg-red-500/20 rounded-full items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-white">
                Welcome to RUFriends!
              </h2>
              <p className="text-white/70">
                {user.user_metadata?.full_name || 'Rutgers Student'}
              </p>
              <p className="text-white/50 text-sm">{user.email}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => router.push('/settings')}>
              <div className="text-2xl mb-2">🎓</div>
              <h3 className="text-white font-semibold">Complete Profile</h3>
              <p className="text-white/60 text-sm">Add your courses and interests</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => router.push('/find-friends')}>
              <div className="text-2xl mb-2">👥</div>
              <h3 className="text-white font-semibold">Find Friends</h3>
              <p className="text-white/60 text-sm">Discover fellow Rutgers students</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => router.push('/posts')}>
              <div className="text-2xl mb-2">📝</div>
              <h3 className="text-white font-semibold">Explore Posts</h3>
              <p className="text-white/60 text-sm">Share updates and discussions</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Setup */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">Setup Your Profile</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📚</span>
                  <span className="text-white">Add Your Courses</span>
                </div>
                {!profileLoading && profile?.classes && profile.classes.length > 0 ? (
                  <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Added</span>
                  </div>
                ) : (
                  <button onClick={() => router.push(`/settings/`)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Add
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🎯</span>
                  <span className="text-white">Set Your Interests</span>
                </div>
                {!profileLoading && profile?.interests && profile.interests.length > 0 ? (
                  <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Added</span>
                  </div>
                ) : (
                  <button onClick={() => router.push(`/settings/`)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Add
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🏫</span>
                  <span className="text-white">Select Your Campus</span>
                </div>
                {!profileLoading && profile?.campus && profile.campus.trim() !== '' ? (
                  <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Added</span>
                  </div>
                ) : (
                  <button onClick={() => router.push(`/settings/`)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Find Friends */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">Find Your Study Partners</h3>
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h4 className="text-xl font-semibold text-white mb-2">Connect with Fellow Scarlet Knights</h4>
                <p className="text-white/60 mb-6">
                  Discover students in your classes, major, or with similar interests. Start building your study network today!
                </p>
                <button 
                  onClick={() => router.push('/find-friends')}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Find Friends
                </button>
              </div>

              {/* Quick Stats */}
              {/* <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-white/60 text-sm">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-white/60 text-sm">Different Majors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">3</div>
                  <div className="text-white/60 text-sm">Campuses</div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Study Groups Preview */}
        {/* <div className="mt-8 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Popular Study Groups</h3>
            <button className="text-red-400 hover:text-red-300 font-medium transition-colors">
              View All
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">💻</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">CS Study Group</h4>
                  <p className="text-white/60 text-sm">142 members</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Collaborative learning for Computer Science courses
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🧪</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Chemistry Lab</h4>
                  <p className="text-white/60 text-sm">89 members</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Lab reports, exam prep, and study sessions
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Business Analytics</h4>
                  <p className="text-white/60 text-sm">76 members</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Data analysis, case studies, and project collaboration
              </p>
            </div>
          </div>
        </div> */}
      </main>
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
