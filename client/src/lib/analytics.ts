// Google Analytics 4 Integration
// See: blueprint:javascript_google_analytics

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track custom events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
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
