"use client";

import { Eye, EyeOff, Lock, Mail, User, Video } from "lucide-react";
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

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateFields({
  name,
  email,
  password,
  confirmPassword,
}: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!name.trim()) e.name = "Name is required";

  if (!email.trim()) {
    e.email = "Email is required";
  } else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
    e.email = "Enter a valid email address";
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  // Set once signUp() comes back with no session — i.e. email confirmation
  // is required. If confirmation isn't enabled (or gets disabled again),
  // signUp() returns a session immediately and this step is skipped
  // entirely, so this file keeps working either way.
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
    // profiles row requires auth.uid() = id under RLS, so this can only
    // happen once a session actually exists — either right after signUp()
    // (confirmation disabled) or after verifySignupOtp() succeeds.
    await authApi.createProfile({ userId, email: email.trim(), name: name.trim(), role: "both" });
    await Promise.all([
      profileApi.createMentorProfile(userId),
      profileApi.createLearnerProfile(userId),
    ]);
    router.push(ROUTES.interestsOnboarding);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateFields({ name, email, password, confirmPassword });
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      const { user, needsVerification } = await authApi.signUp({
        email: email.trim(),
        password,
      });
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
              <h1 className="text-2xl font-bold text-text-primary">Verify your email</h1>
              <p className="text-sm text-text-secondary">
                We sent a 6-digit code to <span className="font-semibold text-text-primary">{email}</span>.
                Enter it below to finish creating your account.
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
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="font-semibold text-accent-link"
                >
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
              <Video size={18} />
            </span>
            <p className="text-sm text-text-secondary">
              Welcome to <span className="font-semibold text-text-primary">Connectiqo</span>
            </p>
            <h1 className="text-2xl font-bold text-text-primary">Create Your Account</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2.5">
            {formError ? (
              <p className="rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
                {formError}
              </p>
            ) : null}

            <AuthTextField
              icon={User}
              placeholder="Full Name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              error={errors.name}
              disabled={loading}
            />

            <AuthTextField
              icon={Mail}
              type="email"
              placeholder="Email Address"
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
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="text-text-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {!errors.password ? (
              <p className="-mt-2 ml-1 text-xs text-text-muted">
                Min 8 chars, one uppercase, one number
              </p>
            ) : null}

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
                  disabled={loading}
                  className="text-text-secondary"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <AuthButton loading={loading} className="mt-1">
              {loading ? "Creating account…" : "Create Account"}
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
