"use client";

import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthButton } from "@/components/auth/AuthButton";
import { AuthTextField } from "@/components/auth/AuthTextField";
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

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      // Every account is dual-role — mentor and learner at once.
      const { user } = await authApi.signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        role: "both",
      });

      if (user?.id) {
        await Promise.all([
          profileApi.createMentorProfile(user.id),
          profileApi.createLearnerProfile(user.id),
        ]);
      }

      router.push(ROUTES.login);
    } catch (error) {
      setFormError((error as Error)?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <h1 className="text-center text-2xl font-bold text-text-primary">Create Account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-semibold text-accent-link">
          Sign In
        </Link>
      </p>
    </main>
  );
}
