import { useState, useEffect, useCallback } from "react";
import { auth, onAuthStateChanged, type User } from "@/lib/firebase";

interface AuthUser {
  sub: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

function firebaseUserToAuthUser(user: User): AuthUser {
  const displayName = user.displayName || "";
  const parts = displayName.split(" ");
  return {
    sub: user.uid,
    email: user.email,
    first_name: parts[0] || null,
    last_name: parts.slice(1).join(" ") || null,
    profile_image_url: user.photoURL,
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserToBackend = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) return;
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: 'google_signin',
          ticker: undefined,
          stage: 0,
          company_name: undefined,
        });
      }
    } catch (e) {
      console.warn("Failed to sync user to backend:", e);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUserToAuthUser(firebaseUser));
        await syncUserToBackend(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [syncUserToBackend]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error: null,
  };
}

export function useDeferredAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);

  const syncUserToBackend = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) return;
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: 'google_signin',
          ticker: undefined,
          stage: 0,
          company_name: undefined,
        });
      }
    } catch (e) {
      console.warn("Failed to sync user to backend:", e);
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const startListening = () => {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUserToAuthUser(firebaseUser));
          syncUserToBackend(firebaseUser);
        } else {
          setUser(null);
        }
        setAuthResolved(true);
        setIsLoading(false);
      });
    };

    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(startListening);
      return () => {
        cancelIdleCallback(idleId);
        unsubscribe?.();
      };
    } else {
      const timerId = setTimeout(startListening, 0);
      return () => {
        clearTimeout(timerId);
        unsubscribe?.();
      };
    }
  }, [syncUserToBackend]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    authResolved,
    error: null,
  };
}
