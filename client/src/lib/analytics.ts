// Firebase Analytics Integration (single pathway to avoid duplicate events)
// See: blueprint:javascript_google_analytics
// Firebase SDK is loaded lazily to keep it out of the initial JS bundle.

type Analytics = import('firebase/analytics').Analytics;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let firebaseAnalytics: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

const initFirebase = async (): Promise<Analytics | null> => {
  if (firebaseAnalytics) return firebaseAnalytics;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn('Firebase config not available, skipping Firebase initialization');
        return null;
      }

      const [{ initializeApp, getApps }, { getAnalytics }] = await Promise.all([
        import('firebase/app'),
        import('firebase/analytics'),
      ]);

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      firebaseAnalytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
      return firebaseAnalytics;
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
      return null;
    }
  })();

  return initPromise;
};

export const initGA = () => {
  initFirebase();
};

const ensureAnalytics = async (): Promise<Analytics | null> => {
  if (firebaseAnalytics) return firebaseAnalytics;
  return initFirebase();
};

const lazyLogEvent = async (
  eventName: string,
  params?: Record<string, unknown>,
) => {
  const instance = await ensureAnalytics();
  if (instance) {
    const { logEvent } = await import('firebase/analytics');
    logEvent(instance, eventName, params);
  }
};

export const trackPageView = (url: string) => {
  lazyLogEvent('page_view', { page_path: url });
};

export const trackEvent = (
  action: string,
  category?: string,
  label?: string,
  value?: number,
) => {
  lazyLogEvent(action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const analytics = {
  trackTickerSearch: (ticker: string) => {
    trackEvent('ticker_search', 'engagement', ticker);
  },

  trackAnalysisStarted: (ticker: string) => {
    trackEvent('analysis_started', 'engagement', ticker);
  },

  trackAnalysisCompleted: (ticker: string) => {
    trackEvent('analysis_completed', 'engagement', ticker);
  },

  trackAnalysisError: (ticker: string, errorMessage: string) => {
    trackEvent('analysis_error', 'error', `${ticker}: ${errorMessage}`);
  },

  trackStageViewed: (stage: number, stageName: string, ticker?: string) => {
    trackEvent('stage_viewed', 'navigation', `Stage ${stage}: ${stageName}`, stage);
    if (ticker) {
      trackEvent('stage_viewed_ticker', 'engagement', `${ticker} - Stage ${stage}`);
    }
  },

  trackShareClicked: (method: string) => {
    trackEvent('share_clicked', 'engagement', method);
  },

  trackThemeToggled: (theme: string) => {
    trackEvent('theme_toggled', 'preferences', theme);
  },

  trackInstallClicked: () => {
    trackEvent('pwa_install_clicked', 'engagement');
  },

  trackLandingSection: (sectionId: string) => {
    trackEvent('landing_section_viewed', 'navigation', sectionId);
  },

  trackCtaClicked: (ctaName: string) => {
    trackEvent('cta_clicked', 'engagement', ctaName);
  },

  trackNewLead: (params: {
    lead_source: 'popup' | 'strategy_email' | 'reminder' | 'paywall_gate' | 'inline_gate' | 'google_signin' | 'coming_soon' | 'mobile_gate_sheet';
    ticker?: string;
    stage?: number;
    company_name?: string;
  }) => {
    lazyLogEvent('new_lead', {
      lead_source: params.lead_source,
      ticker: params.ticker || '',
      stage: params.stage ?? 0,
      company_name: params.company_name || '',
    });
  },
};
