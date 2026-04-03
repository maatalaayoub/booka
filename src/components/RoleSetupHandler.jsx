'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useRouter, usePathname } from 'next/navigation';
import { useRole } from '@/hooks/useRole';

/**
 * Component that handles role assignment after signup
 * Role setup happens silently in the background
 * Note: Business role is handled by BusinessOnboarding, not here
 */
export default function RoleSetupHandler() {
  const { 
    role, 
    hasRole, 
    isLoaded, 
    isSignedIn, 
    assignRole 
  } = useRole();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale || 'en';
  const [setupComplete, setSetupComplete] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const setupAttempted = useRef(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    async function handleRoleSetup() {
      const setupParam = searchParams.get('setup');
      
      console.log('[RoleSetupHandler] State:', { setupParam, isLoaded, isSignedIn, hasRole, role, pathname, setupAttempted: setupAttempted.current });
      
      // Already completed or attempted in this session
      if (setupComplete || setupAttempted.current) {
        console.log('[RoleSetupHandler] Setup already attempted, skipping');
        return;
      }
      
      // IMPORTANT: Skip ALL business-related setup - handled by BusinessOnboarding
      if (setupParam === 'business' || pathname?.includes('/business/')) {
        console.log('[RoleSetupHandler] Business setup detected, skipping (handled by BusinessOnboarding)');
        return;
      }
      
      // No setup needed
      if (!setupParam) {
        console.log('[RoleSetupHandler] No setup param, skipping');
        return;
      }
      
      // Wait for auth to load
      if (!isLoaded) {
        console.log('[RoleSetupHandler] Auth not loaded yet');
        return;
      }
      
      // Not signed in - skip processing
      // IMPORTANT: Don't redirect to sign-up, just wait - the user might have just signed up
      // and the auth state might not be ready yet
      if (!isSignedIn) {
        console.log('[RoleSetupHandler] Not signed in yet, waiting for auth...');
        return;
      }

      // If user already has a role
      if (hasRole) {
        console.log('[RoleSetupHandler] User already has role:', role);
        // Clean URL - remove setup param but stay on current page
        window.history.replaceState({}, '', pathname);
        
        // Stay on home page for all users
        setSetupComplete(true);
        return;
      }

      // User is signed in but no role - assign the role (only for 'user' type, not 'business')
      // Business role is assigned after completing onboarding in BusinessOnboarding component
      if (!hasRole && setupParam === 'user') {
        console.log('[RoleSetupHandler] Assigning role:', setupParam);
        setupAttempted.current = true;
        
        try {
          const result = await assignRole(setupParam);
          
          if (result.success || result.alreadyAssigned) {
            // Normal users have onboarding_completed=true set directly in set-role API
            // No need to call complete-onboarding here
            
            // Clean URL first - remove setup param but stay on current page
            window.history.replaceState({}, '', pathname);
            // All users stay on home page after signup
            setSetupComplete(true);
          } else {
            console.error('Failed to assign role:', result.error, 'Details:', result.details, 'Code:', result.code);
            retryCount.current++;
            if (retryCount.current < MAX_RETRIES) {
              console.log(`[RoleSetupHandler] Will retry (${retryCount.current}/${MAX_RETRIES})...`);
              setupAttempted.current = false;
              setTimeout(() => setRetryTrigger(n => n + 1), 2000 * retryCount.current);
            } else {
              console.error('[RoleSetupHandler] Max retries reached, giving up');
              setSetupComplete(true);
            }
          }
        } catch (error) {
          console.error('Error during role assignment:', error);
          retryCount.current++;
          if (retryCount.current < MAX_RETRIES) {
            console.log(`[RoleSetupHandler] Will retry (${retryCount.current}/${MAX_RETRIES})...`);
            setupAttempted.current = false;
            setTimeout(() => setRetryTrigger(n => n + 1), 2000 * retryCount.current);
          } else {
            console.error('[RoleSetupHandler] Max retries reached, giving up');
            setSetupComplete(true);
          }
        }
      }
    }

    handleRoleSetup();
  }, [isLoaded, isSignedIn, hasRole, role, searchParams, locale, assignRole, router, pathname, setupComplete, retryTrigger]);

  // Don't render anything - role setup happens in the background
  return null;
}
