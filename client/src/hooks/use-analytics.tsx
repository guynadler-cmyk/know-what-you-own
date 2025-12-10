// Google Analytics page view tracking hook
// See: blueprint:javascript_google_analytics

import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (prevLocationRef.current === null) {
      trackPageView(location);
      prevLocationRef.current = location;
    } else if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};
