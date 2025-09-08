'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchProfile();
    }
  }, [user, loading, router]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
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
  };

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
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/')}
                className="text-2xl font-bold text-white transition-colors group"
              >
                <span className="group-hover:text-red-400 transition-colors">RU</span><span className="text-red-400">Friends</span>
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={() => router.push(`/dashboard/`)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Profile
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={() => router.push(`/settings/`)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Settings
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/80 text-sm">
                Welcome, {user.user_metadata?.full_name || user.email}
              </div>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">👋</span>
            </div>
            <div>
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
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-2xl mb-2">🎓</div>
              <h3 className="text-white font-semibold">Complete Profile</h3>
              <p className="text-white/60 text-sm">Add your courses and interests</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="text-white font-semibold">Find Study Partners</h3>
              <p className="text-white/60 text-sm">Connect with classmates</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="text-white font-semibold">Connect & Network</h3>
              <p className="text-white/60 text-sm">Build meaningful connections</p>
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

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
            {/* <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3> */}
            <div className="space-y-4">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌟</div>
                <h4 className="text-xl font-semibold text-white mb-2">Welcome to RUFriends!</h4>
                <p className="text-white/60">
                  Start by completing your profile to find study partners and make connections.
                </p>
              </div>
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
