'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileFormData {
  display_name: string;
  bio: string;
  major: string;
  graduation_year: number | '';
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
}

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileFormData>({
    display_name: '',
    bio: '',
    major: '',
    graduation_year: '',
    campus: '',
    classes: [],
    interests: [],
    social_links: {}
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  
  // Form input states for arrays
  const [newClass, setNewClass] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, keep default values
      } else if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          major: data.major || '',
          graduation_year: data.graduation_year || '',
          campus: data.campus || '',
          classes: data.classes || [],
          interests: data.interests || [],
          social_links: data.social_links || {}
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router, fetchProfile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string | number | string[]) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value || undefined
      }
    }));
  };

  const addClass = () => {
    if (newClass.trim() && !profile.classes.includes(newClass.trim())) {
      handleInputChange('classes', [...profile.classes, newClass.trim()]);
      setNewClass('');
    }
  };

  const removeClass = (classToRemove: string) => {
    handleInputChange('classes', profile.classes.filter(c => c !== classToRemove));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      handleInputChange('interests', [...profile.interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    handleInputChange('interests', profile.interests.filter(i => i !== interestToRemove));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const profileData = {
        user_id: user.id,
        email: user.email,
        display_name: profile.display_name,
        bio: profile.bio,
        major: profile.major,
        graduation_year: profile.graduation_year === '' ? null : Number(profile.graduation_year),
        campus: profile.campus,
        classes: profile.classes,
        interests: profile.interests,
        social_links: profile.social_links,
        updated_at: new Date().toISOString()
      };

      // Try to use upsert first (will work if unique constraint is added)
      // If it fails, fall back to the manual check-and-update approach
      let { error } = await supabase
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error && error.code === '42P10') {
        // Fallback: manual check and update/insert
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('user_id', user.id);
          error = updateError;
        } else {
          // Insert new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([profileData]);
          error = insertError;
        }
      }

      if (error) {
        throw error;
      }

      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      setJustSaved(true);
      
      // Reset the green button state after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
        setSaveMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
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
                onClick={() => router.push(`/find-friends`)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Find Friends
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={() => router.push(`/profile/${user?.id}`)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Profile
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={() => router.push(`/settings/`)}
                className="text-white hover:text-white transition-colors font-medium"
              >
                Settings
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/80 text-sm">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            <p className="text-sm text-white/60 mt-1">Update your profile details and social links</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Save Message */}
            {saveMessage && (
              <div className={`p-4 rounded-lg ${
                saveMessage.type === 'success' 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {saveMessage.text}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Major
                </label>
                <input
                  type="text"
                  value={profile.major}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                  placeholder="Your major"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={profile.graduation_year}
                  onChange={(e) => handleInputChange('graduation_year', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                  placeholder="e.g., 2025"
                  min="2020"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Campus
                </label>
                <select
                  value={profile.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white"
                >
                  <option value="" className="bg-slate-800 text-white">Select Campus</option>
                  <option value="College Ave - New Brunswick" className="bg-slate-800 text-white">College Ave - New Brunswick</option>
                  <option value="Busch - New Brunswick" className="bg-slate-800 text-white">Busch - New Brunswick</option>
                  <option value="Livingston - New Brunswick" className="bg-slate-800 text-white">Livingston - New Brunswick</option>
                  <option value="Douglass - New Brunswick" className="bg-slate-800 text-white">Douglass - New Brunswick</option>
                  <option value="Cook - New Brunswick" className="bg-slate-800 text-white">Cook - New Brunswick</option>
                  <option value="Newark" className="bg-slate-800 text-white">Newark</option>
                  <option value="Camden" className="bg-slate-800 text-white">Camden</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-white/50 mt-1">{profile.bio.length}/500 characters</p>
            </div>

            {/* Classes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Classes
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g., CS112"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && addClass()}
                />
                <button
                  type="button"
                  onClick={addClass}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.classes.map((cls, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-300 border border-red-500/30"
                  >
                    {cls}
                    <button
                      type="button"
                      onClick={() => removeClass(cls)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Interests
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g., Photography, Gaming"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-white placeholder-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-white mb-4">
                Social Links
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  instagram: 'Instagram',
                  snapchat: 'Snapchat', 
                  discord: 'Discord',
                  phone: 'Phone Number',
                  email: 'Email',
                  twitter: 'Twitter'
                }).map(([platform, label]) => (
                  <div key={platform}>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      {label}
                    </label>
                    <input
                      type={platform === 'email' ? 'email' : platform === 'phone' ? 'tel' : 'text'}
                      value={profile.social_links[platform as keyof typeof profile.social_links] || ''}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-white placeholder-white/50"
                      placeholder={
                        platform === 'phone' ? '+1 (555) 123-4567' :
                        platform === 'email' ? 'your.email@example.com' :
                        `@your${platform}`
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={isSaving || !profile.display_name.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isSaving || !profile.display_name.trim()
                    ? 'bg-white/20 text-white/50 cursor-not-allowed'
                    : justSaved
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSaving ? 'Saving...' : justSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
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
