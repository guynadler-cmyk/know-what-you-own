const PAYWALL_UNLOCK_PREFIX = "rn_unlocked_";
const PAYWALL_SKIPPED_PREFIX = "rn_skipped_";
const PAYWALL_SKIPPED_STAGE_PREFIX = "rn_skipped_stage_";
const USER_EMAIL_KEY = "rn_user_email";

export type PaywallState = "locked" | "skipped" | "unlocked";

export function getPaywallState(ticker: string): PaywallState {
  if (!ticker) return "locked";
  const key = ticker.toUpperCase();
  if (localStorage.getItem(`${PAYWALL_UNLOCK_PREFIX}${key}`) === "true") return "unlocked";
  if (localStorage.getItem(`${PAYWALL_SKIPPED_PREFIX}${key}`) === "true") return "skipped";
  return "locked";
}

export function isPaywallUnlocked(ticker?: string): boolean {
  if (!ticker) return false;
  return getPaywallState(ticker) === "unlocked";
}

export function unlockPaywall(ticker: string): void {
  if (!ticker) return;
  const key = ticker.toUpperCase();
  localStorage.setItem(`${PAYWALL_UNLOCK_PREFIX}${key}`, "true");
  localStorage.removeItem(`${PAYWALL_SKIPPED_PREFIX}${key}`);
  localStorage.removeItem(`${PAYWALL_SKIPPED_STAGE_PREFIX}${key}`);
}

export function unlockAllTickers(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.startsWith(PAYWALL_SKIPPED_PREFIX) && !k.startsWith(PAYWALL_SKIPPED_STAGE_PREFIX)) {
      const ticker = k.replace(PAYWALL_SKIPPED_PREFIX, "");
      localStorage.setItem(`${PAYWALL_UNLOCK_PREFIX}${ticker}`, "true");
      localStorage.removeItem(k);
      localStorage.removeItem(`${PAYWALL_SKIPPED_STAGE_PREFIX}${ticker}`);
    }
  });
}

export function skipPaywall(ticker: string, stage: number): void {
  if (!ticker) return;
  const key = ticker.toUpperCase();
  localStorage.setItem(`${PAYWALL_SKIPPED_PREFIX}${key}`, "true");
  localStorage.setItem(`${PAYWALL_SKIPPED_STAGE_PREFIX}${key}`, stage.toString());
}

export function getSkippedStage(ticker: string): number | null {
  if (!ticker) return null;
  const key = ticker.toUpperCase();
  const val = localStorage.getItem(`${PAYWALL_SKIPPED_STAGE_PREFIX}${key}`);
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

export function shouldShowPaywall(stage: number): boolean {
  return stage >= 4;
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function setStoredEmail(email: string): void {
  localStorage.setItem(USER_EMAIL_KEY, email.toLowerCase().trim());
}
