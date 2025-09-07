'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">
                RU<span className="text-red-400">Friends</span>
              </h1>
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
      <main className="max-w-6xl mx-auto px-6 py-12">
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
              <div className="text-2xl mb-2">💬</div>
              <h3 className="text-white font-semibold">Join Groups</h3>
              <p className="text-white/60 text-sm">Participate in discussions</p>
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
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Add
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🎯</span>
                  <span className="text-white">Set Your Interests</span>
                </div>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Add
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🏫</span>
                  <span className="text-white">Select Your Campus</span>
                </div>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Select
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
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
        <div className="mt-8 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
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
        </div>
      </main>
    </div>
  );
}
