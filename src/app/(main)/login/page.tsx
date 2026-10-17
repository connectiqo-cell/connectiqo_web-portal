"use client";

import { AlertCircle, Eye, EyeOff, Lock, Mail, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { authApi } from "@/lib/api/authApi";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { toSafeRelativePath } from "@/lib/utils/safeRedirect";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where to land after login when the caller didn't ask for a specific page
 * (e.g. a deep link via ?next=). Brands get a totally different dashboard
 * from mentors/learners — sending them to the generic home feed by default
 * would land them on mentor/video content that has nothing to do with
 * their account, which is exactly the confusion this avoids. */
async function resolveDefaultDestination(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (data?.role !== "brand") return ROUTES.home;

  const brandProfile = await profileApi.getBrandProfile(userId).catch(() => null);
  if (!brandProfile?.industry || !brandProfile?.description) return ROUTES.brandOnboarding;
  return ROUTES.brandCampaigns;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitNext = toSafeRelativePath(searchParams.get("next"));

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
      router.push(explicitNext || (user?.id ? await resolveDefaultDestination(user.id) : ROUTES.home));
    } catch (error) {
      setLoginError((error as Error)?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }

  };

  return (
    <div className="flex flex-1">
      <AuthVisualPanel />

      <main className="flex w-full flex-1 items-center justify-center px-6 py-16 lg:w-[40%]">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ backgroundImage: "var(--gradient-button-primary)" }}
            >
              <Video size={20} />
            </span>
            <p className="text-sm text-text-secondary">
              Welcome to <span className="font-semibold text-text-primary">Connectiqo</span>
            </p>
            <h1 className="text-2xl font-bold text-text-primary">Welcome Back</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

          <p className="text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href={ROUTES.signup} className="font-semibold text-accent-link">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
