"use client";

import { useState, useEffect } from "react";
import { Check, X, ShieldAlert } from "lucide-react";
import Cookies from "js-cookie"; 

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [preferences, setPreferences] = useState({
    essential: true, // Always true[cite: 7]
    analytical: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = Cookies.get("consent_preferences");
    if (!consent) {
      setIsVisible(true);
    } else {
      try {
        setPreferences(JSON.parse(consent));
      } catch {
        try {
          setPreferences(JSON.parse(decodeURIComponent(consent)));
        } catch {}
      }
      // Trigger trackers if consent was previously given
      window.dispatchEvent(new Event("consentUpdated"));
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent = { essential: true, analytical: true, marketing: true };
    Cookies.set("consent_preferences", JSON.stringify(allConsent), { expires: 365, secure: true, sameSite: 'strict' });
    setIsVisible(false);
    window.dispatchEvent(new Event("consentUpdated"));
  };

  const handleRejectAll = () => {
    const strictConsent = { essential: true, analytical: false, marketing: false };
    Cookies.set("consent_preferences", JSON.stringify(strictConsent), { expires: 365, secure: true, sameSite: 'strict' });
    setIsVisible(false);
    window.dispatchEvent(new Event("consentUpdated"));
  };

  const handleSavePreferences = () => {
    Cookies.set("consent_preferences", JSON.stringify(preferences), { expires: 365, secure: true, sameSite: 'strict' });
    setIsVisible(false);
    setShowPreferences(false);
    window.dispatchEvent(new Event("consentUpdated"));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 fade-in duration-700 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl text-zinc-900 dark:text-zinc-50 p-6 rounded-3xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/50 pointer-events-auto border border-zinc-200/50 dark:border-zinc-800/50">
        
        {!showPreferences ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-start md:items-center">
              <div className="hidden md:flex p-3 bg-primary-500/10 text-primary-500 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-1 tracking-tight">Your Privacy Matters</h3>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  We use cookies to secure your session, analyze traffic, and tailor content. We strictly respect your choices.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={() => setShowPreferences(true)} 
                className="px-4 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Manage
              </button>
              <button 
                onClick={handleRejectAll} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
              >
                Reject All
              </button>
              <button 
                onClick={handleAcceptAll} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black tracking-tight">Manage Cookie Preferences</h3>
              <button onClick={() => setShowPreferences(false)} className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">Essential (Required)</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Stores authentication credentials and essential profile access.</p>
                </div>
                <div className="p-1.5 bg-primary-500/10 rounded-full">
                  <Check className="w-5 h-5 text-primary-500" />
                </div>
              </div>
              
              {/* Analytical Cookies */}
              <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">Analytical</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Allows us to use Analytics to measure application performance.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={preferences.analytical}
                    onChange={(e) => setPreferences({...preferences, analytical: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 border border-zinc-300 dark:border-zinc-600 peer-checked:border-primary-500"></div>
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">Marketing</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Used for tailored features, geolocation, and external integrations.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 border border-zinc-300 dark:border-zinc-600 peer-checked:border-primary-500"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={handleSavePreferences} 
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}