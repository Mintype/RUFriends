'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  display_name: string;
  bio: string;
  major: string;
  graduation_year: number;
  campus: string;
  classes: string[];
  interests: string[];
  social_links: {
    instagram?: string;
    snapchat?: string;
    discord?: string;
    phone?: string;
    email?: string;
    twitter?: string;
  };
  created_at: string;
}

export default function UserProfile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userid as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setNotFound(true);
          return;
        }

        if (data) {
          setProfile({
            id: data.id,
            display_name: data.display_name,
            bio: data.bio || '',
            major: data.major || '',
            graduation_year: data.graduation_year,
            campus: data.campus || '',
            classes: data.classes || [],
            interests: data.interests || [],
            social_links: data.social_links || {},
            created_at: data.created_at
          });
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && !user) {
      router.push('/');
    } else if (user && userId) {
      fetchProfile();
    }
  }, [user, authLoading, userId, router]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Create a temporary toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
      toast.textContent = `${type} copied!`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatSocialLink = (platform: string, value: string) => {
    switch (platform) {
      case 'instagram':
        return value.startsWith('@') ? value : `@${value}`;
      case 'twitter':
        return value.startsWith('@') ? value : `@${value}`;
      case 'discord':
        return value;
      case 'snapchat':
        return value;
      case 'phone':
        return value;
      case 'email':
        return value;
      default:
        return value;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-6xl mb-4">😔</div>
          <div className="text-white text-2xl mb-2">Profile Not Found</div>
          <div className="text-white/60 mb-6">This user doesn&apos;t have a profile yet or it doesn&apos;t exist.</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
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
                onClick={() => router.push(`/profile/${user.id}`)}
                className="text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
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
                  router.push(`/profile/${user.id}`);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white font-medium px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
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

      {/* Profile Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {profile && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            {/* Profile Header */}
            <div className="p-8 border-b border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{profile.display_name}</h1>
                  <div className="flex items-center space-x-4 text-white/60">
                    {profile.major && <span>{profile.major}</span>}
                    {profile.graduation_year && (
                      <>
                        <span>•</span>
                        <span>Class of {profile.graduation_year}</span>
                      </>
                    )}
                    {profile.campus && (
                      <>
                        <span>•</span>
                        <span>{profile.campus}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-white/40 text-sm">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              {profile.bio && (
                <p className="text-white/80 text-lg leading-relaxed">{profile.bio}</p>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Classes */}
              {profile.classes.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Current Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.classes.map((cls, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-500/20 border border-red-400/30 text-red-300 rounded-full text-sm"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profile.interests.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            {Object.keys(profile.social_links).some(key => profile.social_links[key as keyof typeof profile.social_links]) && (
              <div className="p-8 border-t border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Connect with {isOwnProfile ? 'Me' : profile.display_name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(profile.social_links).map(([platform, value]) => {
                    if (!value) return null;
                    
                    const platformData: { [key: string]: { icon: string; name: string; color: string } } = {
                      instagram: { icon: '📸', name: 'Instagram', color: 'from-pink-500 to-purple-600' },
                      snapchat: { icon: '👻', name: 'Snapchat', color: 'from-yellow-400 to-yellow-500' },
                      discord: { icon: '💬', name: 'Discord', color: 'from-indigo-500 to-purple-600' },
                      phone: { icon: '📱', name: 'Phone', color: 'from-green-500 to-green-600' },
                      email: { icon: '📧', name: 'Email', color: 'from-blue-500 to-blue-600' },
                      twitter: { icon: '🐦', name: 'Twitter', color: 'from-sky-400 to-blue-500' }
                    };

                    const data = platformData[platform];
                    if (!data) return null;

                    return (
                      <button
                        key={platform}
                        onClick={() => copyToClipboard(value, data.name)}
                        className="group relative flex items-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-r ${data.color} rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200`}>
                          <span className="text-white text-lg">{data.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white/70 text-xs font-medium uppercase tracking-wider">
                            {data.name}
                          </div>
                          <div className="text-white font-medium text-sm">
                            {formatSocialLink(platform, value)}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 text-white/50 text-xs transition-opacity duration-200">
                          Copy
                        </div>
                        
                        {/* Subtle hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State for Social Links */}
            {!Object.keys(profile.social_links).some(key => profile.social_links[key as keyof typeof profile.social_links]) && (
              <div className="p-8 border-t border-white/10">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Contact Information</h3>
                  <p className="text-white/60 mb-4">
                    {isOwnProfile 
                      ? "Add your social links to let people connect with you!" 
                      : `${profile.display_name} hasn't shared any contact information yet.`}
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => router.push('/settings')}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Add Contact Info
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
