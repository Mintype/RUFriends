'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-6 py-3">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-white hover:text-red-400 transition-colors">
            RU<span className="text-red-400">Friends</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm">Home</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-medium border border-red-500/30 mb-6">
              📋 Legal Information
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Privacy <span className="text-red-400">Policy</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how RUFriends collects, uses, and protects your information.
            </p>
            <div className="text-white/60 text-sm mt-4">
              Last updated: Semptember 11, 2025
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="prose prose-lg prose-invert max-w-none">
              
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">1.</span>
                  Information We Collect
                </h2>
                <div className="text-white/80 space-y-4">
                  <h3 className="text-xl font-semibold text-white/90">Personal Information</h3>
                  <p>When you create an account with RUFriends, we collect:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your Rutgers email address (@rutgers.edu)</li>
                    <li>Your name and profile information from Google authentication</li>
                    <li>Profile picture (if provided through Google)</li>
                    <li>Academic information you choose to share (major, year, courses)</li>
                    <li>Other information you choose to share (Instagram, Discord, Phone Number, etc)</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-white/90 mt-6">Usage Information</h3>
                  <p>We automatically collect information about how you use RUFriends:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Pages visited and features used</li>
                    <li>Time spent on the platform</li>
                    <li>Device and browser information</li>
                    <li>IP address and location data (general area only)</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">2.</span>
                  How We Use Your Information
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>We use your information to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create and maintain your RUFriends account</li>
                    <li>Verify your eligibility as a Rutgers student</li>
                    <li>Match you with compatible study partners and friends</li>
                    <li>Improve our platform and develop new features</li>
                    <li>Send important updates about the service</li>
                    <li>Ensure platform safety and prevent abuse</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">3.</span>
                  Information Sharing
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>RUFriends is built on the principle of connecting Rutgers students safely. Here&apos;s how we handle your information:</p>
                  
                  <h3 className="text-xl font-semibold text-white/90">With Other Students</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Only information you make visible on your profile</li>
                    <li>Your name and profile picture</li>
                    <li>Academic information you&apos;ve chosen to share publicly</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-white/90 mt-4">We Never Share</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your email address with other students</li>
                    <li>Your personal information with advertisers</li>
                    <li>Your data with third parties for marketing purposes</li>
                    <li>Any information that could compromise your safety</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">4.</span>
                  Data Security
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>We take your security seriously and implement multiple layers of protection:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All data is encrypted in transit and at rest</li>
                    <li>Secure authentication through Google OAuth</li>
                    <li>Regular backups with encrypted storage</li>
                  </ul>
                  <p className="mt-4">
                    While we implement robust security measures, no system is 100% secure. We continuously work to improve our security practices.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">5.</span>
                  Your Rights and Choices
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>You have several rights regarding your personal information:</p>
                  
                  <h3 className="text-xl font-semibold text-white/90">Account Control</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Update your profile information at any time</li>
                    <li>Control what information is visible to other students</li>
                    <li>Delete your account and associated data</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-white/90 mt-4">Communication Preferences</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Opt out of non-essential emails</li>
                    <li>Control notification settings</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">6.</span>
                  Rutgers University Relationship
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>
                    <strong>Important:</strong> RUFriends is an independent platform created by students. 
                    We are not officially affiliated with Rutgers University, though we serve the Rutgers community exclusively.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We verify Rutgers email addresses to ensure community membership</li>
                    <li>We do not share student data with Rutgers University</li>
                    <li>We operate independently of university policies (except where legally required)</li>
                    <li>We respect the Rutgers community values and Code of Student Conduct</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">7.</span>
                  Data Retention
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>We retain your information for as long as:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your account remains active</li>
                    <li>Required to provide you with services</li>
                    <li>Necessary to comply with legal obligations</li>
                    <li>Needed to resolve disputes or enforce agreements</li>
                  </ul>
                  <p className="mt-4">
                    When you delete your account, we remove your personal information within 30 days, 
                    except for information we&apos;re required to retain by law.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">8.</span>
                  Changes to This Policy
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices 
                    or for legal compliance. When we make changes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We&apos;ll notify you via email if changes are significant</li>
                    <li>We&apos;ll update the &quot;Last updated&quot; date at the top of this page</li>
                    <li>We&apos;ll give you time to review changes before they take effect</li>
                    <li>Your continued use of RUFriends means you accept the updated policy</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-red-400 mr-2">9.</span>
                  Contact Us
                </h2>
                <div className="text-white/80 space-y-4">
                  <p>
                    If you have questions about this Privacy Policy or want to exercise your rights, 
                    please contact us:
                  </p>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mt-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-red-400">📧</span>
                        <a href="mailto:mintype.code@gmail.com" className="text-red-300 hover:text-red-400 transition-colors">
                          mintype.code@gmail.com
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-red-400">🐛</span>
                        <a 
                          href="https://github.com/Mintype/RUFriends/issues" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-red-300 hover:text-red-400 transition-colors"
                        >
                          Report Privacy Concerns on GitHub
                        </a>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-red-400">⏰</span>
                        <span className="text-red-300">We respond to privacy requests within 7 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
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
