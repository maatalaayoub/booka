'use client';

import { useState, useEffect, useCallback } from 'react';

export function useUserProfile({ refetchOnFocus = false, refetchOnProfileUpdate = false } = {}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch('/api/user-profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('Failed to fetch user profile:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!refetchOnFocus && !refetchOnProfileUpdate) return;

    const handlers = [];

    if (refetchOnFocus) {
      const handleFocus = () => fetchProfile();
      window.addEventListener('focus', handleFocus);
      handlers.push(() => window.removeEventListener('focus', handleFocus));
    }

    if (refetchOnProfileUpdate) {
      const handleUpdate = () => fetchProfile();
      window.addEventListener('profile-photo-updated', handleUpdate);
      handlers.push(() => window.removeEventListener('profile-photo-updated', handleUpdate));
    }

    return () => handlers.forEach(cleanup => cleanup());
  }, [refetchOnFocus, refetchOnProfileUpdate, fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}
