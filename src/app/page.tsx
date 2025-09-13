'use client';

import { supabase } from './lib/supabase';
import { useAuth } from './lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

const handleJoinClick = async (user: User | null, router: ReturnType<typeof useRouter>) => {
  // If user is already authenticated, go to dashboard
  if (user) {
    router.push('/dashboard');
    return;
  }

  // Get the correct origin URL
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Otherwise, start Google authentication
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/dashboard`, // Use the determined origin
      queryParams: {
        hd: 'rutgers.edu' // Restrict to Rutgers domain
      }
    }
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    alert('Error signing in with Google. Please try again.');
  }
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-6 py-3">
        <div className="flex items-center justify-center md:justify-between md:space-x-8">
          <Link href="/" className="text-xl font-bold text-white hover:text-red-400 transition-colors">
            RU<span className="text-red-400">Friends</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm">Features</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors text-sm">About</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors text-sm">Contact</a>
          </div>
          <button 
            onClick={() => handleJoinClick(user, router)}
            className="hidden md:block bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Join Now'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <div className="inline-block bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium border border-red-500/30">
                🏫 For Rutgers Students Only
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white leading-none">
                Connect.
                <br />
                <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Study.
                </span>
                <br />
                Friendship.
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              The exclusive social platform designed for Rutgers students to forge meaningful connections, 
              create study groups, and build lifelong friendships.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button 
                onClick={() => handleJoinClick(user, router)}
                className="group bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/25"
              >
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </span>
              </button>
            </div>

            {/* Stats -> to add later lol */}
            <div className="pt-16 grid grid-cols-3 gap-8 max-w-md mx-auto opacity-0">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">2.5K+</div>
                <div className="text-white/60 text-sm">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">150+</div>
                <div className="text-white/60 text-sm">Study Groups</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-white/60 text-sm">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="relative bg-white/5 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Choose <span className="text-red-400">RUFriends</span>?
              </h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Designed specifically for the Rutgers community with features that matter most to students.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-6xl mb-6">🏫</div>
                <h3 className="text-2xl font-bold text-white mb-4">Campus Focused</h3>
                <p className="text-white/70 leading-relaxed">
                  Connect exclusively with verified Rutgers students across all campuses! New Brunswick, Newark, and Camden.
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-6xl mb-6">📚</div>
                <h3 className="text-2xl font-bold text-white mb-4">Smart Matching</h3>
                <p className="text-white/70 leading-relaxed">
                  Matching based on your courses, interests, and study preferences for perfect study partnerships.
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-6xl mb-6">⚡</div>
                <h3 className="text-2xl font-bold text-white mb-4">Safe & Secure</h3>
                <p className="text-white/70 leading-relaxed">
                  University email verification, moderated communities, and privacy controls keep your experience safe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="relative py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-block bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium border border-red-500/30 mb-6">
                  🎓 About RUFriends
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Built By Students,
                  <br />
                  <span className="text-red-400">For Students</span>
                </h2>
                <div className="space-y-4 text-white/70 text-lg leading-relaxed">
                  <p>
                    RUFriends was created by Rutgers students who understood the challenge of connecting with like-minded peers in a large university environment. We believe that meaningful relationships and academic success go hand in hand.
                  </p>
                  <p>
                    Our platform is designed exclusively for the Rutgers community, ensuring that every connection you make is with a fellow Scarlet Knight who shares your academic journey and campus experience.
                  </p>
                  <p>
                    Whether you&apos;re looking for study partners, project collaborators, or lifelong friends, RUFriends provides the tools and community to make those connections happen naturally and safely.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-red-400">100%</div>
                    <div className="text-white/60">Rutgers Students</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-red-400">24/7</div>
                    <div className="text-white/60">Safe Environment</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-3xl">🏛️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">The Rutgers Difference</h3>
                    <div className="space-y-4 text-white/70">
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>Verified @rutgers.edu email required</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>All three campuses supported</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>Find study buddies in your classes</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        <span>Connect with students in your major</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="relative bg-white/5 backdrop-blur-sm border-t border-white/10 py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Get In <span className="text-red-400">Touch</span>
              </h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Have questions, suggestions, or want to contribute? We&apos;d love to hear from the Rutgers community.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">💬</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">General Inquiries</h3>
                    <p className="text-white/60">Questions about the platform</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <a 
                    href="mailto:mintype.code@gmail.com" 
                    className="flex items-center space-x-3 text-white/70 hover:text-red-400 transition-colors"
                  >
                    <span>📧</span>
                    <span>mintype.code@gmail.com</span>
                  </a>
                  <div className="flex items-center space-x-3 text-white/70">
                    <span>⏰</span>
                    <span>We typically respond within 24 hours</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">🛠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Technical Support</h3>
                    <p className="text-white/60">Bug reports and technical issues</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <a 
                    href="https://github.com/Mintype/RUFriends/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-white/70 hover:text-red-400 transition-colors"
                  >
                    <span>🐛</span>
                    <span>Report an Issue on GitHub</span>
                  </a>
                  <div className="flex items-center space-x-3 text-white/70">
                    <span>🔄</span>
                    <span>Open source contributions welcome</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-md rounded-3xl p-8 border border-red-500/30 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Want to Contribute?</h3>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                RUFriends is an open-source project built by and for the Rutgers community. Whether you&apos;re a developer, designer, or just have great ideas, we welcome your contributions!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://github.com/Mintype/RUFriends" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative py-20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Make Your
              <br />
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Rutgers Experience
              </span>
              <br />
              Unforgettable?
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Join the growing community of Rutgers students who&apos;ve discovered their perfect study partners and lifelong friends.
            </p>
            <button 
              onClick={() => handleJoinClick(user, router)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/30"
            >
              {user ? 'Go to Dashboard 🎓' : 'Start Your Journey Today 🎓'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
