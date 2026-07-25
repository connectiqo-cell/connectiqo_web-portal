"use client";

import { AlertCircle, Eye, EyeOff, Lock, Mail, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { authApi } from "@/lib/api/authApi";
import { ROUTES } from "@/lib/routes";
import { resolvePostLoginRoute } from "@/lib/utils/postAuthRedirect";
import { toSafeRelativePath } from "@/lib/utils/safeRedirect";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = toSafeRelativePath(searchParams.get("next")) || ROUTES.home;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginError("");
    setLoading(true);
    try {
      const { user } = await authApi.signIn({ email: trimmedEmail, password });
      const destination = user ? await resolvePostLoginRoute(user.id, next) : next;
      router.push(destination);
    } catch (error) {
      setLoginError((error as Error)?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <Video size={40} className="text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
        <p className="text-sm text-text-secondary">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {loginError ? (
          <div className="flex items-center gap-2 rounded-xl border border-accent-error/35 bg-accent-error/10 px-3.5 py-2.5 text-sm text-accent-error">
            <AlertCircle size={18} className="shrink-0" />
            <p className="flex-1">{loginError}</p>
            <button type="button" onClick={() => setLoginError("")} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        ) : null}

        <AuthTextField
          icon={Mail}
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (loginError) setLoginError("");
          }}
          disabled={loading}
        />

        <AuthTextField
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (loginError) setLoginError("");
          }}
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

        <Link
          href={ROUTES.forgotPassword}
          className="self-end text-sm font-semibold text-accent-primary"
        >
          Forgot Password?
        </Link>

        <AuthButton loading={loading} className="mt-1">
          {loading ? "Signing in…" : "Sign In"}
        </AuthButton>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.signup} className="font-semibold text-accent-link">
          Create one
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
