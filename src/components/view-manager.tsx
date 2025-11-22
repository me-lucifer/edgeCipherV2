"use client";

import { useState, useEffect } from 'react';
import { ViewSelector } from '@/components/view-selector';
import { PublicWebsiteView } from '@/components/public-website-view';
import { AdminAppView } from '@/components/admin-app-view';

export type View = 'selector' | 'website' | 'admin';

export function ViewManager() {
  const [currentView, setCurrentView] = useState<View | null>(null);

  useEffect(() => {
    const storedView = localStorage.getItem('ec_view') as View | null;
    if (storedView && ['website', 'admin'].includes(storedView)) {
      setCurrentView(storedView);
    } else {
      setCurrentView('selector');
    }
  }, []);

  const handleSelectView = (view: View) => {
    if (view !== 'selector') {
      localStorage.setItem('ec_view', view);
    }
    setCurrentView(view);
  };

  const handleSwitchView = () => {
    localStorage.removeItem('ec_view');
    setCurrentView('selector');
  };

  if (currentView === null) {
    return (
        <div className="flex h-screen w-screen items-center justify-center" />
    );
  }

  if (currentView === 'selector') {
    return <ViewSelector onSelectView={handleSelectView} />;
  }

  if (currentView === 'website') {
    return <PublicWebsiteView onSwitchView={handleSwitchView} />;
  }

  if (currentView === 'admin') {
    return <AdminAppView onSwitchView={handleSwitchView} />;
  }

  return null;
}
