'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';

const WorkerContext = createContext({
  memberships: [],
  activeMembership: null,
  permissions: {},
  loading: true,
  switchBusiness: () => {},
});

export function WorkerProvider({ children }) {
  const { isLoaded, user } = useAuthUser();
  const [memberships, setMemberships] = useState([]);
  const [activeMembership, setActiveMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemberships() {
      try {
        const res = await fetch('/api/worker/memberships');
        if (res.ok) {
          const body = await res.json();
          const list = body.data || body || [];
          setMemberships(list);

          if (list.length > 0) {
            const savedId = typeof window !== 'undefined'
              ? localStorage.getItem('worker-active-business')
              : null;
            const found = savedId && list.find((m) => m.businessInfoId === savedId);
            setActiveMembership(found || list[0]);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      fetchMemberships();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const switchBusiness = useCallback((membership) => {
    setActiveMembership(membership);
    if (typeof window !== 'undefined') {
      localStorage.setItem('worker-active-business', membership.businessInfoId);
    }
  }, []);

  const permissions = activeMembership?.permissions || {};

  return (
    <WorkerContext.Provider value={{ memberships, activeMembership, permissions, loading, switchBusiness }}>
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorker() {
  return useContext(WorkerContext);
}
