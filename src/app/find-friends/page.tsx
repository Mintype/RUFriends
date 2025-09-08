'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  major: string;
  graduation_year: number;
  campus: string;
  classes: string[];
  interests: string[];
  social_links: Record<string, string>;
  created_at: string;
}

interface FilterState {
  searchTerm: string;
  campus: string;
  major: string;
  graduationYear: string;
  interests: string;
}

export default function Browse() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    campus: '',
    major: '',
    graduationYear: '',
    interests: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      fetchProfiles();
    }
  }, [user, loading, router]);

  useEffect(() => {
    applyFilters();
  }, [profiles, filters]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          bio,
          major,
          graduation_year,
          campus,
          classes,
          interests,
          social_links,
          created_at
        `)
        .eq('is_active', true)
        .neq('user_id', user.id) // Exclude current user
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...profiles];

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.display_name.toLowerCase().includes(searchLower) ||
        profile.bio?.toLowerCase().includes(searchLower) ||
        profile.major?.toLowerCase().includes(searchLower) ||
        profile.classes?.some(cls => cls.toLowerCase().includes(searchLower)) ||
        profile.interests?.some(interest => interest.toLowerCase().includes(searchLower))
      );
    }

    // Campus filter
    if (filters.campus) {
      filtered = filtered.filter(profile => 
        profile.campus?.toLowerCase().includes(filters.campus.toLowerCase())
      );
    }

    // Major filter
    if (filters.major) {
      filtered = filtered.filter(profile => 
        profile.major?.toLowerCase().includes(filters.major.toLowerCase())
      );
    }

    // Graduation year filter
    if (filters.graduationYear) {
      const yearStr = filters.graduationYear.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.graduation_year?.toString().includes(yearStr)
      );
    }

    // Interests filter - now supports typing to match interests
    if (filters.interests) {
      const interestTerms = filters.interests.toLowerCase().split(/[,\s]+/).filter(term => term.trim());
      if (interestTerms.length > 0) {
        filtered = filtered.filter(profile => 
          profile.interests?.some(interest => 
            interestTerms.some(term =>
              interest.toLowerCase().includes(term)
            )
          )
        );
      }
    }

    setFilteredProfiles(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
                onClick={() => router.push('/dashboard')}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/find-friends')}
                className="text-white font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Find Friends
              </button>
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Settings
              </button>
            </div>

            {/* Desktop User Info */}
            <div className="hidden md:block text-white/80 text-sm max-w-48 truncate">
              {user.user_metadata?.full_name || user.email}
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
                  router.push('/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white/70 hover:text-white px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  router.push('/find-friends');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-white font-medium px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Find Friends
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
                  router.push('/settings');
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
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Find Friends</h1>
          <p className="text-white/70">Discover and connect with fellow Rutgers students</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, major, interests, or classes..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {/* Campus Filter */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Campus</label>
              <input
                type="text"
                placeholder="e.g. New Brunswick, Newark..."
                value={filters.campus}
                onChange={(e) => handleFilterChange('campus', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Major Filter */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Major</label>
              <input
                type="text"
                placeholder="e.g. Computer Science..."
                value={filters.major}
                onChange={(e) => handleFilterChange('major', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Graduation Year Filter */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Graduation Year</label>
              <input
                type="text"
                placeholder="e.g. 2024, 2025..."
                value={filters.graduationYear}
                onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Interests Filter */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Interests</label>
              <input
                type="text"
                placeholder="e.g. Gaming, Music, Sports..."
                value={filters.interests}
                onChange={(e) => handleFilterChange('interests', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Showing {filteredProfiles.length} of {profiles.length} students
              {filters.interests && (
                <span className="ml-2 text-white/40">
                  • Filtering by: {filters.interests}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Results */}
        {profilesLoading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading profiles...</div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No students found</h3>
            <p className="text-white/70">
              {filters.searchTerm || filters.campus || filters.major || filters.graduationYear || filters.interests
                ? 'Try adjusting your filters to find more students'
                : 'Be the first to create a profile and help others find you!'
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 cursor-pointer"
                onClick={() => router.push(`/profile/${profile.user_id}`)}
              >
                {/* Profile Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">
                      {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{profile.display_name}</h3>
                    {profile.major && (
                      <p className="text-white/60 text-sm">{profile.major}</p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-white/70 text-sm mb-4 line-clamp-3">
                    {profile.bio}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {profile.campus && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-white/40">📍</span>
                      <span className="text-white/70">{profile.campus} Campus</span>
                    </div>
                  )}
                  {profile.graduation_year && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-white/40">🎓</span>
                      <span className="text-white/70">Class of {profile.graduation_year}</span>
                    </div>
                  )}
                  {profile.classes && profile.classes.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-white/40">📚</span>
                      <span className="text-white/70">
                        {profile.classes.slice(0, 2).join(', ')}
                        {profile.classes.length > 2 && ` +${profile.classes.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.slice(0, 4).map((interest, index) => (
                      <span
                        key={index}
                        className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                    {profile.interests.length > 4 && (
                      <span className="text-white/40 text-xs px-2 py-1">
                        +{profile.interests.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Connection Actions */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
