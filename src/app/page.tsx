export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-6 py-3">
        <div className="flex items-center space-x-8">
          <a href="/" className="text-xl font-bold text-white hover:text-red-400 transition-colors">
            RU<span className="text-red-400">Friends</span>
          </a>
          <div className="hidden md:flex space-x-6">
            <a href="#about" className="text-white/80 hover:text-white transition-colors text-sm">About</a>
            <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm">Features</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors text-sm">Contact</a>
          </div>
          <button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-600 transition-colors">
            Join Now
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
              <button className="group bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/25">
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  Get Started Free
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
                <div className="text-6xl mb-6">�</div>
                <h3 className="text-2xl font-bold text-white mb-4">Campus Focused</h3>
                <p className="text-white/70 leading-relaxed">
                  Connect exclusively with verified Rutgers students across all campuses! New Brunswick, Newark, and Camden.
                </p>
              </div>

              <div className="group bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-6xl mb-6">📚</div>
                <h3 className="text-2xl font-bold text-white mb-4">Smart Matching</h3>
                <p className="text-white/70 leading-relaxed">
                  Intelligent matching based on your courses, interests, and study preferences for perfect study partnerships.
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
              Join the growing community of Rutgers students who've discovered their perfect study partners and lifelong friends.
            </p>
            <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-500/30">
              Start Your Journey Today 🎓
            </button>
          </div>
        </div>
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
