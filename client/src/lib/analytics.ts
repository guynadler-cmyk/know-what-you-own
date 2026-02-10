// Firebase Analytics Integration (single pathway to avoid duplicate events)
// See: blueprint:javascript_google_analytics

import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

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

// Initialize Analytics (Firebase only - no direct gtag to avoid duplicate events)
export const initGA = () => {
  // Initialize Firebase Analytics only
  initFirebase();
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  // Firebase Analytics only
  if (firebaseAnalytics) {
    logEvent(firebaseAnalytics, 'page_view', {
      page_path: url
    });
  }
};

// Track custom events - sends to Firebase only
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  // Firebase Analytics only
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

  trackNewLead: (params: {
    lead_source: 'popup' | 'strategy_email' | 'reminder';
    ticker?: string;
    stage?: number;
    company_name?: string;
  }) => {
    if (firebaseAnalytics) {
      logEvent(firebaseAnalytics, 'new_lead', {
        lead_source: params.lead_source,
        ticker: params.ticker || '',
        stage: params.stage ?? 0,
        company_name: params.company_name || '',
      });
    }
  },
};
