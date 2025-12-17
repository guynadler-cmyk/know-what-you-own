// Google Analytics 4 + Firebase Analytics Integration
// See: blueprint:javascript_google_analytics

import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// GA4 Measurement ID - this is a public identifier (visible in browser network requests)
const GA_MEASUREMENT_ID = 'G-6CLK9XVV2K';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase Analytics instance
let firebaseAnalytics: Analytics | null = null;

// Initialize Firebase
const initFirebase = () => {
  try {
    // Check if Firebase config is available
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase config not available, skipping Firebase initialization');
      return null;
    }

    // Only initialize if not already initialized
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firebaseAnalytics = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
    return firebaseAnalytics;
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error);
    return null;
  }
};

// Initialize Google Analytics (legacy gtag)
export const initGA = () => {
  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;
  document.head.appendChild(script2);
  
  // Initialize Firebase Analytics
  initFirebase();
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  // GA4 gtag
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url
    });
  }
  
  // Firebase Analytics
  if (firebaseAnalytics) {
    logEvent(firebaseAnalytics, 'page_view', {
      page_path: url
    });
  }
};

// Track custom events - sends to both GA4 and Firebase
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  // GA4 gtag
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
  
  // Firebase Analytics
  if (firebaseAnalytics) {
    logEvent(firebaseAnalytics, action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom event helpers for restnvest-specific tracking
export const analytics = {
  // Track when a user submits a ticker for analysis
  trackTickerSearch: (ticker: string) => {
    trackEvent('ticker_search', 'engagement', ticker);
  },

  // Track when analysis starts loading
  trackAnalysisStarted: (ticker: string) => {
    trackEvent('analysis_started', 'engagement', ticker);
  },

  // Track when analysis completes successfully
  trackAnalysisCompleted: (ticker: string) => {
    trackEvent('analysis_completed', 'engagement', ticker);
  },

  // Track when analysis fails
  trackAnalysisError: (ticker: string, errorMessage: string) => {
    trackEvent('analysis_error', 'error', `${ticker}: ${errorMessage}`);
  },

  // Track stage navigation
  trackStageViewed: (stage: number, stageName: string, ticker?: string) => {
    trackEvent('stage_viewed', 'navigation', `Stage ${stage}: ${stageName}`, stage);
    if (ticker) {
      trackEvent('stage_viewed_ticker', 'engagement', `${ticker} - Stage ${stage}`);
    }
  },

  // Track share button clicks
  trackShareClicked: (method: string) => {
    trackEvent('share_clicked', 'engagement', method);
  },

  // Track theme toggle
  trackThemeToggled: (theme: string) => {
    trackEvent('theme_toggled', 'preferences', theme);
  },

  // Track PWA install attempts
  trackInstallClicked: () => {
    trackEvent('pwa_install_clicked', 'engagement');
  },

  // Track landing page section views
  trackLandingSection: (sectionId: string) => {
    trackEvent('landing_section_viewed', 'navigation', sectionId);
  },

  // Track CTA clicks
  trackCtaClicked: (ctaName: string) => {
    trackEvent('cta_clicked', 'engagement', ctaName);
  },
};
