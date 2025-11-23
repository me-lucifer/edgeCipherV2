
"use client";

import { useState, useEffect } from 'react';
import { ViewSelector } from '@/components/view-selector';
import { PublicWebsiteView } from '@/components/public-website-view';
import { AdminAppView } from '@/components/admin-app-view';
import { useAuth } from '@/context/auth-provider';
import { OnboardingView } from './onboarding-view';
import { AuthenticatedAppShell } from './authenticated-app-shell';

export type DevView = 'selector' | 'website' | 'admin';
type AppView = 'publicLanding' | 'onboarding' | 'authenticatedApp';

export function ViewManager() {
  const [devView, setDevView] = useState<DevView | null>(null);
  const { authToken, isOnboardingComplete, authLoading, logout } = useAuth();
  
  // Dev view state management
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedView = localStorage.getItem('ec_view') as DevView | null;
      if (storedView && ['website', 'admin'].includes(storedView)) {
        setDevView(storedView);
      } else {
        setDevView('selector');
      }
    }
  }, []);

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
    return 'authenticatedApp';
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
          // We can't just switch view, because the user is not authenticated. 
          // For the prototype, we can explain this to the user.
          alert("This action is for an already logged-in and onboarded user. Please log in to see the dashboard.");
        }}/>;
      case 'onboarding':
        return <OnboardingView />;
      case 'authenticatedApp':
        return <AuthenticatedAppShell />;
    }
  }

  return null;
}
