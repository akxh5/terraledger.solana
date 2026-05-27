import React, { useState, useEffect } from 'react';

/**
 * DemoMode component handles the keyboard shortcut (Ctrl+Shift+D) 
 * to toggle a global demo mode. It shows a badge when active.
 */
export const DemoMode = () => {
  const [isDemo, setIsDemo] = useState(localStorage.getItem('terraledger_demo_mode') === 'true');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        const newValue = !isDemo;
        setIsDemo(newValue);
        localStorage.setItem('terraledger_demo_mode', String(newValue));
        
        // Trigger a custom event so other components can react without a full context
        window.dispatchEvent(new CustomEvent('terraledger_demo_toggle', { detail: newValue }));
        
        console.log(`Demo Mode: ${newValue ? 'ENABLED' : 'DISABLED'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemo]);

  if (!isDemo) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="bg-black/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-[0.2em] backdrop-blur-md shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Demo Mode
      </div>
    </div>
  );
};

/**
 * Hook to use demo mode state in any component
 */
export const useDemoMode = () => {
  const [isDemo, setIsDemo] = useState(localStorage.getItem('terraledger_demo_mode') === 'true');

  useEffect(() => {
    const handleToggle = (e: any) => setIsDemo(e.detail);
    window.addEventListener('terraledger_demo_toggle', handleToggle);
    return () => window.removeEventListener('terraledger_demo_toggle', handleToggle);
  }, []);

  return isDemo;
};
