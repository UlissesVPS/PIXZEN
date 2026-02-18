import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi } from '@/services/subscriptionApi';

interface TrialStatus {
  isTrialExpired: boolean;
  daysRemaining: number;
  isLoggedIn: boolean;
  isLoading: boolean;
}

export const useTrialCheck = (): TrialStatus => {
  const { user, isLoading: authLoading, isDemoMode } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isTrialExpired: false,
    daysRemaining: 7,
    isLoggedIn: false,
    isLoading: true
  });

  useEffect(() => {
    const checkTrialStatus = async () => {
      if (authLoading) {
        return;
      }

      // Skip trial check in demo mode
      if (isDemoMode) {
        setStatus({
          isTrialExpired: false,
          daysRemaining: 7,
          isLoggedIn: false,
          isLoading: false
        });
        return;
      }

      if (!user) {
        setStatus({
          isTrialExpired: false,
          daysRemaining: 7,
          isLoggedIn: false,
          isLoading: false
        });
        return;
      }

      try {
        const { data } = await subscriptionApi.getStatus();
        // data should have: { isExpired, isActive, daysRemaining, plano }
        const subData = data;

        if (subData.isActive) {
          setStatus({
            isTrialExpired: false,
            daysRemaining: 0,
            isLoggedIn: true,
            isLoading: false
          });
          return;
        }

        setStatus({
          isTrialExpired: subData.isExpired ?? false,
          daysRemaining: subData.daysRemaining ?? 0,
          isLoggedIn: true,
          isLoading: false
        });
      } catch {
        setStatus({
          isTrialExpired: false,
          daysRemaining: 7,
          isLoggedIn: true,
          isLoading: false
        });
      }
    };

    checkTrialStatus();
    
    // Check every minute for trial expiration
    const interval = setInterval(checkTrialStatus, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading, isDemoMode]);

  return status;
};

export const markAsSubscribed = async (_userId: string) => {
  try {
    await subscriptionApi.activate();
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};
