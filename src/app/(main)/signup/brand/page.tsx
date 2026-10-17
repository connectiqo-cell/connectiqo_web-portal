"use client";

import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { authApi } from "@/lib/api/authApi";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Free/personal email providers — brand accounts must sign up with a work
// email at their own company's domain, not a personal inbox.
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.in",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "rediffmail.com",
  "yandex.com",
  "gmx.com",
  "zoho.com",
]);

function isWorkEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && !PERSONAL_EMAIL_DOMAINS.has(domain);
}

interface FieldErrors {
  companyName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateFields({
  companyName,
  email,
  password,
  confirmPassword,
}: {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!companyName.trim()) e.companyName = "Company / brand name is required";

  if (!email.trim()) {
    e.email = "Work email is required";
  } else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
    e.email = "Enter a valid email address";
  } else if (!isWorkEmail(email)) {
    e.email = "Please use your company's work email, not a personal address (Gmail, Yahoo, etc.)";
  }

  if (password.length < 8) {
    e.password = "Must be at least 8 characters";
  } else if (!/[A-Z]/.test(password)) {
    e.password = "Must contain at least one uppercase letter";
  } else if (!/[0-9]/.test(password)) {
    e.password = "Must contain at least one number";
  }
  if (!e.password && password !== confirmPassword) {
    e.confirmPassword = "Passwords do not match";
  }
  return e;
}

/** CollabHub brand signup — web-only. Mirrors the regular signup page's
 * OTP-verification flow (src/app/(main)/signup/page.tsx), but creates a
 * profiles.role: 'brand' row + brand_profiles instead of mentor/learner/
 * creator, and routes into the mandatory brand onboarding step rather than
 * interests onboarding. */
export default function BrandSignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const finishSignup = async (userId: string) => {
    await authApi.createProfile({ userId, email: email.trim(), name: companyName.trim(), role: "brand" });
    await profileApi.createBrandProfile({ userId, companyName: companyName.trim(), workEmail: email.trim() });
    router.push(ROUTES.brandOnboarding);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateFields({ companyName, email, password, confirmPassword });
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      const { user, needsVerification } = await authApi.signUp({ email: email.trim(), password });
      if (!user?.id) throw new Error("Sign up did not return a user.");

      if (needsVerification) {
        setStep("otp");
        return;
      }

      await finishSignup(user.id);
    } catch (error) {
      setFormError((error as Error)?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!otp.trim()) {
      setOtpError("Enter the code we sent you");
      return;
    }
    setOtpError("");
    setVerifying(true);
    try {
      const { user } = await authApi.verifySignupOtp(email, otp);
      if (!user?.id) throw new Error("Verification did not return a user.");
      await finishSignup(user.id);
    } catch (error) {
      setOtpError((error as Error)?.message || "Invalid or expired code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setResending(true);
    try {
      await authApi.resendSignupOtp(email);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (error) {
      setOtpError((error as Error)?.message || "Could not resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="flex flex-1">
        <AuthVisualPanel />

        <main className="flex w-full flex-1 items-center justify-center px-6 py-6 lg:w-[40%]">
          <div className="flex w-full max-w-sm flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span
                className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundImage: "var(--gradient-button-primary)" }}
              >
                <Mail size={18} />
              </span>
              <p className="text-sm text-text-secondary">
                Welcome to <span className="font-semibold text-text-primary">Connectiqo</span>
              </p>
              <h1 className="text-2xl font-bold text-text-primary">Verify your work email</h1>
              <p className="text-sm text-text-secondary">
                We sent a 6-digit code to <span className="font-semibold text-text-primary">{email}</span>.
                Enter it below to finish creating your brand account.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-2.5">
              {otpError ? (
                <p className="rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
                  {otpError}
                </p>
              ) : null}
              {resent ? (
                <p className="rounded-xl border border-accent-success/35 bg-accent-success/10 px-3.5 py-2.5 text-sm text-accent-success">
                  Code resent — check your inbox.
                </p>
              ) : null}

              <AuthTextField
                icon={Lock}
                type="text"
                placeholder="6-digit code"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (otpError) setOtpError("");
                }}
                disabled={verifying}
              />

              <AuthButton loading={verifying} className="mt-1">
                {verifying ? "Verifying…" : "Verify & Continue"}
              </AuthButton>
            </form>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-semibold text-accent-link disabled:opacity-60"
                >
                  {resending ? "Resending…" : "Resend code"}
                </button>
              </p>
              <p className="text-sm text-text-secondary">
                Wrong email?{" "}
                <button type="button" onClick={() => setStep("form")} className="font-semibold text-accent-link">
                  Go back
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <AuthVisualPanel />

      <main className="flex w-full flex-1 items-center justify-center px-6 py-6 lg:w-[40%]">
        <div className="flex w-full max-w-sm flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span
              className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Building2 size={18} />
            </span>
            <p className="text-sm text-text-secondary">
              Welcome to <span className="font-semibold text-text-primary">Connectiqo</span> CollabHub
            </p>
            <h1 className="text-2xl font-bold text-text-primary">Create Your Brand Account</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
            {formError ? (
              <p className="rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
                {formError}
              </p>
            ) : null}

            <AuthTextField
              icon={Building2}
              placeholder="Company / Brand Name"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                clearError("companyName");
              }}
              error={errors.companyName}
              disabled={loading}
            />

            <AuthTextField
              icon={Mail}
              type="email"
              placeholder="Work Email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              error={errors.email}
              disabled={loading}
            />

            <AuthTextField
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              error={errors.password}
              disabled={loading}
              rightSlot={
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <AuthTextField
              icon={Lock}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              error={errors.confirmPassword}
              disabled={loading}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <AuthButton loading={loading} className="mt-1">
              {loading ? "Creating account…" : "Create Brand Account"}
            </AuthButton>
          </form>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary">
              By continuing you agree to our{" "}
              <Link href={ROUTES.terms} className="font-semibold text-accent-link">
                Terms
              </Link>{" "}
              &amp;{" "}
              <Link href={ROUTES.privacy} className="font-semibold text-accent-link">
                Privacy Policy
              </Link>
              .
            </p>

            <p className="text-sm text-text-secondary">
              Signing up as a creator instead?{" "}
              <Link href={ROUTES.signup} className="font-semibold text-accent-link">
                Go back
              </Link>
            </p>
            <p className="text-sm text-text-secondary">
              Already have an account?{" "}
              <Link href={ROUTES.login} className="font-semibold text-accent-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
