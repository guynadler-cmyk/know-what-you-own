import { createContext, useContext, useState, ReactNode } from "react";
import type { WatchlistSnapshot } from "@shared/schema";

export interface NavAnalysisState {
  ticker: string;
  companyName: string;
  getSnapshot: (() => WatchlistSnapshot) | null;
}

interface NavContextValue {
  analysisState: NavAnalysisState | null;
  setAnalysisState: (state: NavAnalysisState | null) => void;
}

const NavContext = createContext<NavContextValue>({
  analysisState: null,
  setAnalysisState: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const [analysisState, setAnalysisState] = useState<NavAnalysisState | null>(null);
  return (
    <NavContext.Provider value={{ analysisState, setAnalysisState }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavContext() {
  return useContext(NavContext);
}
