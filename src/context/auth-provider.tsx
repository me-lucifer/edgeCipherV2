
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type OnboardingStep = "welcome" | "questionnaire" | "broker" | "history" | "persona" | "completed";

interface AuthState {
  authToken: string | null;
  isEmailVerified: boolean;
  isOnboardingComplete: boolean;
  onboardingStep: OnboardingStep;
  authLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, emailVerified: boolean, onboardingComplete: boolean, step: OnboardingStep) => void;
  logout: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    authToken: null,
    isEmailVerified: false,
    isOnboardingComplete: false,
    onboardingStep: 'welcome',
    authLoading: true,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ec_auth_token');
      const emailVerified = localStorage.getItem('ec_email_verified') === 'true';
      const onboardingComplete = localStorage.getItem('ec_onboarding_complete') === 'true';
      const step = (localStorage.getItem('ec_onboarding_step') as OnboardingStep) || 'welcome';
      
      setAuthState({
        authToken: token,
        isEmailVerified: emailVerified,
        isOnboardingComplete: onboardingComplete,
        onboardingStep: step,
        authLoading: false,
      });
    }
  }, []);

  const login = useCallback((token: string, emailVerified: boolean, onboardingComplete: boolean, step: OnboardingStep) => {
    localStorage.setItem('ec_auth_token', token);
    localStorage.setItem('ec_email_verified', String(emailVerified));
    localStorage.setItem('ec_onboarding_complete', String(onboardingComplete));
    localStorage.setItem('ec_onboarding_step', step);
    setAuthState({ authToken: token, isEmailVerified: emailVerified, isOnboardingComplete: onboardingComplete, onboardingStep: step, authLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ec_auth_token');
    localStorage.removeItem('ec_email_verified');
    localStorage.removeItem('ec_onboarding_complete');
    localStorage.removeItem('ec_onboarding_step');
    localStorage.removeItem('ec_broker_connected');
    localStorage.removeItem('ec_broker_name');
    localStorage.removeItem('ec_persona_base');
    localStorage.removeItem('ec_persona_final');
    localStorage.removeItem('ec_onboarding_answers');
    localStorage.removeItem('ec_banner_shown'); // Also clear banner
    setAuthState({ authToken: null, isEmailVerified: false, isOnboardingComplete: false, onboardingStep: 'welcome', authLoading: false });
    window.location.reload(); // Reload to ensure all state is reset
  }, []);

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    localStorage.setItem('ec_onboarding_step', step);
    setAuthState(prev => ({ ...prev, onboardingStep: step }));
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('ec_onboarding_complete', 'true');
    localStorage.setItem('ec_onboarding_step', 'completed');
    setAuthState(prev => ({ ...prev, isOnboardingComplete: true, onboardingStep: 'completed' }));
  }, []);

  const value = {
    ...authState,
    login,
    logout,
    setOnboardingStep,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
