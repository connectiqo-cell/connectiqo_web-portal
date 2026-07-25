"use client";

import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, MailCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/authApi";
import { ROUTES } from "@/lib/routes";

type Step = 1 | 2 | 3;

const STEP_META: Record<Step, { icon: typeof KeyRound; title: string; subtitle: (email: string) => string }> = {
  1: {
    icon: KeyRound,
    title: "Forgot Password?",
    subtitle: () => "Enter your registered email and we'll send a 6-digit verification code.",
  },
  2: {
    icon: MailCheck,
    title: "Enter Code",
    subtitle: (email) => `A verification code was sent to ${email}`,
  },
  3: {
    icon: Lock,
    title: "New Password",
    subtitle: () => "Choose a strong password for your account.",
  },
};

function StepDots({ current }: { current: Step }) {
  return (
    <div className="mb-8 flex justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`flex h-2.5 items-center justify-center rounded-full transition-all ${
            current === n
              ? "w-7 bg-accent-primary"
              : current > n
                ? "w-2.5 bg-accent-success"
                : "w-2.5 bg-border-light"
          }`}
        />
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { setPendingPasswordReset, signOut } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSendOtp = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    
    setError("");
    setLoading(true);
    try {
      await authApi.sendPasswordResetOtp(email);
      setStep(2);
    } catch (err) {
      setError((err as Error)?.message || "Could not send code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.trim().length < 4) {
      setError("Please enter the full code from your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Blocks the app shell from treating this transient session as a real login.
      setPendingPasswordReset(true);
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (err) {
      setPendingPasswordReset(false);
      setError((err as Error)?.message || "The code is incorrect or has expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.updatePassword(password);
      await signOut();
      setPendingPasswordReset(false);
      setNotice("Password updated. Please log in with your new password.");
      setTimeout(() => router.push(ROUTES.login), 1500);
    } catch (err) {
      setError((err as Error)?.message || "Failed to save password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const meta = STEP_META[step];
  const Icon = meta.icon;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-2 px-6 py-16">
      <StepDots current={step} />

      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Icon size={44} className="text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">{meta.title}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{meta.subtitle(email)}</p>
      </div>

      {notice ? (
        <p className="rounded-xl border border-accent-success/35 bg-accent-success/10 px-3.5 py-2.5 text-center text-sm text-accent-success">
          {notice}
        </p>
      ) : (
        <>
          {error ? (
            <p className="mb-3 rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
              {error}
            </p>
          ) : null}

          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-4">
              <AuthTextField
                icon={MailCheck}
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <AuthButton loading={loading}>
                {loading ? "Sending Code…" : "Send Code"}
              </AuthButton>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-4">
              <input
                placeholder="Enter code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                inputMode="numeric"
                maxLength={8}
                className="rounded-xl border-2 border-accent-primary bg-surface-sheet px-3.5 py-3 text-center text-2xl font-bold tracking-[0.5em] text-text-primary focus:outline-none"
              />
              <AuthButton loading={loading}>
                {loading ? "Verifying…" : "Verify Code"}
              </AuthButton>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="text-center text-sm text-text-secondary"
              >
                Didn&apos;t receive a code?{" "}
                <span className="font-semibold text-accent-primary">Resend</span>
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSavePassword} noValidate className="flex flex-col gap-4">
              <AuthTextField 
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-text-secondary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <div className="flex flex-col gap-1.5">
                <div
                  className={`flex items-center gap-2 rounded-xl border bg-surface-sheet px-3.5 py-3 ${
                    passwordsMatch
                      ? "border-accent-success"
                      : passwordsMismatch
                        ? "border-accent-error"
                        : "border-border-light"
                  }`}
                >
                  <Lock size={18} className="shrink-0 text-text-secondary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  {passwordsMatch ? (
                    <CheckCircle2 size={18} className="text-accent-success" />
                  ) : null}
                  {passwordsMismatch ? <XCircle size={18} className="text-accent-error" /> : null}
                </div>
                {passwordsMismatch ? (
                  <p className="ml-1 text-xs text-accent-error">Passwords do not match</p>
                ) : null}
              </div>
              <AuthButton
                loading={loading}
                disabled={password !== confirmPassword || password.length < 6}
              >
                {loading ? "Saving…" : "Save Password"}
              </AuthButton>
            </form>
          )}
        </>
      )}
    </main>
  );
}
