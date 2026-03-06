import { useState, useEffect, useRef } from "react";
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged,
  signInWithGoogle,
} from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { BookOpen, TrendingUp, EyeOff, X, Loader2 } from "lucide-react";

type PageState = "checking" | "valid" | "signup";

const REDIRECT_URL = "https://restnvest.com/app";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function FoundingPage() {
  const [pageState, setPageState] = useState<PageState>("checking");
  const tokenRef = useRef<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";

    if (!token) {
      window.location.href = REDIRECT_URL;
      return;
    }

    tokenRef.current = token;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (user) {
        window.location.href = REDIRECT_URL;
        return;
      }

      try {
        const tokenDoc = await getDoc(doc(db, "inviteTokens", token));
        if (!tokenDoc.exists() || tokenDoc.data()?.active !== true) {
          window.location.href = REDIRECT_URL;
          return;
        }
        setPageState("valid");
      } catch {
        window.location.href = REDIRECT_URL;
      }
    });
  }, []);

  async function writeFoundingMember(
    uid: string,
    displayName: string,
    userEmail: string
  ) {
    await setDoc(
      doc(db, "users", uid),
      {
        foundingMember: true,
        accessToken: tokenRef.current,
        createdAt: new Date(),
        displayName,
        email: userEmail,
      },
      { merge: true }
    );
  }

  async function syncToInternalDB(firebaseUser: import("firebase/auth").User) {
    try {
      const idToken = await firebaseUser.getIdToken();
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
    } catch {
      // Non-fatal — user is created in Firebase/Firestore regardless
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const user = await signInWithGoogle();
      await writeFoundingMember(
        user.uid,
        user.displayName || "",
        user.email || ""
      );
      await syncToInternalDB(user);
      window.location.href = REDIRECT_URL;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user") {
        setFormError(null);
      } else {
        setFormError("Something went wrong with Google sign-in. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name.trim() });
      await writeFoundingMember(result.user.uid, name.trim(), email);
      await syncToInternalDB(result.user);
      window.location.href = REDIRECT_URL;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setFormError("This email is already registered. Try signing in with Google.");
      } else if (code === "auth/weak-password") {
        setFormError("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setFormError("Please enter a valid email address.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  if (pageState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F6" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#1B6B6B" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#F8F8F6", color: "#1a1a1a" }}
    >
      <div className="flex justify-center pt-8 pb-0 px-6">
        <span
          className="text-sm font-semibold tracking-widest"
          style={{ color: "#374151", letterSpacing: "0.12em" }}
        >
          restnvest
        </span>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ color: "#1B6B6B", letterSpacing: "0.18em" }}
            data-testid="text-founding-label"
          >
            Founding Member Access
          </p>

          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#111827" }}
            data-testid="text-founding-headline"
          >
            Free access.<br />Locked in for life.
          </h1>

          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: "#6B7280" }}
            data-testid="text-founding-subheadline"
          >
            restnvest is free right now — but that won't last forever. Founding
            members lock in free access for life, no matter what we charge down
            the road.
          </p>

          <button
            data-testid="button-create-account"
            onClick={() => setPageState("signup")}
            className="w-full sm:w-auto sm:px-10 py-3 rounded-md text-white font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "#1B6B6B" }}
          >
            Create Your Account →
          </button>

          <div className="mt-12 flex flex-col gap-5 text-left max-w-xs mx-auto">
            {[
              { icon: BookOpen, text: "Research stocks like an owner, not a gambler" },
              { icon: TrendingUp, text: "Understand the business before you buy" },
              { icon: EyeOff, text: "No noise. No predictions. Just clarity." },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 shrink-0"
                  size={17}
                  style={{ color: "#1B6B6B" }}
                />
                <span className="text-sm leading-snug" style={{ color: "#374151" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center pb-8 px-6">
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          restnvest · Built for long-term investors
        </p>
      </footer>

      {pageState === "signup" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
          data-testid="modal-signup"
        >
          <div
            className="relative w-full max-w-sm rounded-md p-8"
            style={{ background: "#ffffff" }}
          >
            <button
              data-testid="button-close-modal"
              onClick={() => { setPageState("valid"); setFormError(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "#111827" }}
            >
              Create Your Account
            </h2>

            <button
              data-testid="button-google-signin"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-md border text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-60"
              style={{
                background: "#ffffff",
                borderColor: "#D1D5DB",
                color: "#374151",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
              <span className="text-xs" style={{ color: "#9CA3AF" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
            </div>

            <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
              <input
                data-testid="input-name"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none focus:ring-2 disabled:opacity-60"
                style={{
                  borderColor: "#D1D5DB",
                  color: "#111827",
                  background: "#FAFAFA",
                }}
              />
              <input
                data-testid="input-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none focus:ring-2 disabled:opacity-60"
                style={{
                  borderColor: "#D1D5DB",
                  color: "#111827",
                  background: "#FAFAFA",
                }}
              />
              <input
                data-testid="input-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none focus:ring-2 disabled:opacity-60"
                style={{
                  borderColor: "#D1D5DB",
                  color: "#111827",
                  background: "#FAFAFA",
                }}
              />
              <input
                data-testid="input-confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none focus:ring-2 disabled:opacity-60"
                style={{
                  borderColor: "#D1D5DB",
                  color: "#111827",
                  background: "#FAFAFA",
                }}
              />

              {formError && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#DC2626" }}
                  data-testid="text-form-error"
                >
                  {formError}
                </p>
              )}

              <button
                data-testid="button-submit-signup"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-md text-white text-sm font-semibold mt-1 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "#1B6B6B" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
