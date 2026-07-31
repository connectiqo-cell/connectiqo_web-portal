"use client";

import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, User, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { authApi } from "@/lib/api/authApi";
import { profileApi } from "@/lib/api/profileApi";
import { ROUTES } from "@/lib/routes";
import { resolvePostLoginRoute } from "@/lib/utils/postAuthRedirect";
import { toSafeRelativePath } from "@/lib/utils/safeRedirect";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validateSignupFields({
  name,
  email,
  password,
  confirmPassword,
}: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): SignupErrors {
  const e: SignupErrors = {};
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

function CenteredAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = toSafeRelativePath(searchParams.get("next")) || ROUTES.home;

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedEmail = loginEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginError("");
    setLoginLoading(true);
    try {
      const { user } = await authApi.signIn({ email: trimmedEmail, password: loginPassword });
      const destination = user ? await resolvePostLoginRoute(user.id, next) : next;
      router.push(destination);
    } catch (error) {
      setLoginError((error as Error)?.message || "Something went wrong. Please try again.");
      setLoginLoading(false);
    }
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();

    const fieldErrors = validateSignupFields({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });
    if (Object.keys(fieldErrors).length > 0) {
      setSignupErrors(fieldErrors);
      return;
    }
    setSignupErrors({});
    setSignupError("");
    setSignupLoading(true);
    try {
      const { user } = await authApi.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        name: signupName.trim(),
        role: "both",
      });

      if (user?.id) {
        await Promise.all([
          profileApi.createMentorProfile(user.id),
          profileApi.createLearnerProfile(user.id),
        ]);
      }

      router.push(ROUTES.categoriesOnboarding);
    } catch (error) {
      setSignupError((error as Error)?.message || "Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const clearSignupError = (field: keyof SignupErrors) => {
    if (signupErrors[field]) setSignupErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Login */}
        {activeTab === "login" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "36px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px", display: "inline-block", color: "#7c3aed" }}>
                <Video size={40} />
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>Welcome Back</h1>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Sign in to continue</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {loginError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#dc2626" }}>
                  <AlertCircle size={16} />
                  <span style={{ flex: 1 }}>{loginError}</span>
                  <button type="button" onClick={() => setLoginError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                <Mail size={18} style={{ color: "#9d5fff" }} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); if (loginError) setLoginError(""); }}
                  disabled={loginLoading}
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }}
                  autoComplete="email"
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                <Lock size={18} style={{ color: "#9d5fff" }} />
                <input
                  type={showLoginPwd ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); if (loginError) setLoginError(""); }}
                  disabled={loginLoading}
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} disabled={loginLoading} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9d5fff" }}>
                  {showLoginPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ textAlign: "right" }}>
                <Link href={ROUTES.forgotPassword} style={{ fontSize: "14px", color: "#7c3aed", textDecoration: "none", fontWeight: "600" }}>
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" disabled={loginLoading} style={{ width: "100%", padding: "14px", marginTop: "8px", border: "none", borderRadius: "25px", background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#ffffff", fontSize: "15px", fontWeight: "700", cursor: loginLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loginLoading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)" }}>
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              Don't have an account?{" "}
              <button type="button" onClick={() => setActiveTab("signup")} style={{ background: "none", border: "none", color: "#7c3aed", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                Create one
              </button>
            </p>
          </div>
        )}

        {/* Signup */}
        {activeTab === "signup" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "36px" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px", display: "inline-block", color: "#7c3aed" }}>
                <Video size={40} />
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 8px" }}>Create Account</h1>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Join Connectiqo and start connecting!</p>
            </div>

            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {signupError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#dc2626" }}>{signupError}</div>}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                <User size={18} style={{ color: "#9d5fff" }} />
                <input type="text" placeholder="Full Name" value={signupName} onChange={(e) => { setSignupName(e.target.value); clearSignupError("name"); }} disabled={signupLoading} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }} autoComplete="name" />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                <Mail size={18} style={{ color: "#9d5fff" }} />
                <input type="email" placeholder="Email Address" value={signupEmail} onChange={(e) => { setSignupEmail(e.target.value); clearSignupError("email"); }} disabled={signupLoading} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }} autoComplete="email" />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                  <Lock size={18} style={{ color: "#9d5fff" }} />
                  <input type={showSignupPwd ? "text" : "password"} placeholder="Password" value={signupPassword} onChange={(e) => { setSignupPassword(e.target.value); clearSignupError("password"); }} disabled={signupLoading} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowSignupPwd(!showSignupPwd)} disabled={signupLoading} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9d5fff" }}>
                    {showSignupPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!signupErrors.password && <p style={{ fontSize: "12px", color: "#9d5fff", margin: "6px 0 0", textAlign: "left", paddingLeft: "16px" }}>Min 8 chars, one uppercase, one number</p>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f0e6ff", border: "1px solid #e9d5ff", borderRadius: "12px", padding: "14px 16px", transition: "all 0.2s" }}>
                <Lock size={18} style={{ color: "#9d5fff" }} />
                <input type={showConfirmPwd ? "text" : "password"} placeholder="Confirm Password" value={signupConfirmPassword} onChange={(e) => { setSignupConfirmPassword(e.target.value); clearSignupError("confirmPassword"); }} disabled={signupLoading} style={{ border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1a1a1a", flex: 1, fontFamily: "inherit" }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} disabled={signupLoading} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9d5fff" }}>
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={signupLoading} style={{ width: "100%", padding: "14px", marginTop: "8px", border: "none", borderRadius: "25px", background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#ffffff", fontSize: "15px", fontWeight: "700", cursor: signupLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: signupLoading ? 0.7 : 1, transition: "all 0.2s", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)" }}>
                {signupLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              Already have an account?{" "}
              <button type="button" onClick={() => setActiveTab("login")} style={{ background: "none", border: "none", color: "#7c3aed", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CenteredAuthPage() {
  return (
    <Suspense fallback={null}>
      <CenteredAuthForm />
    </Suspense>
  );
}
