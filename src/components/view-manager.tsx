
"use client";

import { useState } from 'react';
import { ViewSelector } from '@/components/view-selector';
import { PublicWebsiteView } from '@/components/public-website-view';
import { AdminAppView } from '@/components/admin-app-view';
import { useAuth } from '@/context/auth-provider';
import { DashboardPlaceholder } from './dashboard-placeholder';
import { OnboardingView } from './onboarding-view';

export type DevView = 'selector' | 'website' | 'admin';
type AppView = 'publicLanding' | 'onboarding' | 'dashboardPlaceholder';

export function ViewManager() {
  const [devView, setDevView] = useState<DevView | null>(null);
  const { authToken, isOnboardingComplete, authLoading } = useAuth();
  
  // Dev view state management
  useState(() => {
    if (typeof window !== 'undefined') {
      const storedView = localStorage.getItem('ec_view') as DevView | null;
      if (storedView && ['website', 'admin'].includes(storedView)) {
        setDevView(storedView);
      } else {
        setDevView('selector');
      }
    }
  });

  const handleSelectDevView = (view: DevView) => {
    if (view !== 'selector') {
      localStorage.setItem('ec_view', view);
    }
    setDevView(view);
  };

  const handleSwitchDevView = () => {
    localStorage.removeItem('ec_view');
    setDevView('selector');
  };
  
  // Determine which main app view to show based on auth state
  const getAppView = (): AppView => {
    if (!authToken) {
      return 'publicLanding';
    }
    if (!isOnboardingComplete) {
      return 'onboarding';
    }
    return 'dashboardPlaceholder';
  }

  const appView = getAppView();

  if (authLoading || devView === null) {
    return (
        <div className="flex h-screen w-screen items-center justify-center" />
    );
  }

  // Handle dev view selection first
  if (devView === 'selector') {
    return <ViewSelector onSelectView={handleSelectDevView} />;
  }

  if (devView === 'admin') {
    return <AdminAppView onSwitchView={handleSwitchDevView} />;
  }

  // If devView is 'website', use the auth-based routing
  if (devView === 'website') {
    switch(appView) {
      case 'publicLanding':
        return <PublicWebsiteView onSwitchView={handleSwitchDevView} onShowDashboard={() => {
          // This simulates a direct navigation to dashboard for an already onboarded user
          // For the prototype, we can just toggle a local state
          console.log("Simulating dashboard view for an already-onboarded user.");
        }}/>;
      case 'onboarding':
        return <OnboardingView />;
      case 'dashboardPlaceholder':
        return <DashboardPlaceholder onBack={() => {
            // This is tricky in the prototype. We can't go "back" to the landing page
            // if auth rules say we should be on dashboard. 
            // For now, we'll log out to reset.
            console.log("For prototype, logging out to return to landing page.");
            localStorage.removeItem('ec_auth_token');
            localStorage.removeItem('ec_onboarding_complete');
            window.location.reload();
        }} />;
    }
  }

  return null;
}
