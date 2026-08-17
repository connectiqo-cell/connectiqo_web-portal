"use client";

import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
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
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function validateSignupFields({
  name,
  email,
  phone,
  password,
  confirmPassword,
}: {
  name: string;
  email: string;
  phone: string;
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

  if (!phone.trim()) {
    e.phone = "Phone number is required";
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

function UnifiedAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = toSafeRelativePath(searchParams.get("next")) || ROUTES.home;

  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);

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
      phone: signupPhone,
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

      router.push(ROUTES.interestsOnboarding);
    } catch (error) {
      setSignupError((error as Error)?.message || "Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const clearSignupError = (field: keyof SignupErrors) => {
    if (signupErrors[field]) setSignupErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const purple = "#6d4aff";

  return (
    <div style={{ fontFamily: "'Inter', Helvetica, Arial, sans-serif", background: "#ffffff" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          minHeight: "900px",
          background: "linear-gradient(150deg, #140a35 0%, #1c0f4a 55%, #241357 100%)",
          overflow: "hidden",
        }}
      >
        {/* Decorative gradients */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "420px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,92,255,0.28), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            left: "-100px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Left Panel */}
        <div
          style={{
            flex: "1 1 480px",
            minWidth: "0",
            padding: "56px 48px 56px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "28px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px", fontSize: "26px", fontWeight: "800" }}>
            <span style={{ color: "#ffffff" }}>Connect</span>
            <span style={{ color: "#9c8bff" }}>iqo</span>
          </div>

          <div>
            <h1 style={{ margin: "0", fontSize: "46px", lineHeight: "1.12", fontWeight: "800", color: "#ffffff" }}>Connect with</h1>
            <h1
              style={{
                margin: "0",
                fontSize: "46px",
                lineHeight: "1.12",
                fontWeight: "800",
                background: "linear-gradient(90deg, #ffffff, #a78bfa)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Connectiqo
            </h1>
          </div>

          <p style={{ margin: "0", maxWidth: "380px", fontSize: "16px", lineHeight: "1.6", color: "#b9b3d6" }}>
            1-on-1 video sessions with your favorite creators, mentors & experts. Build real connections. Learn, grow and earn together.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { title: "1-on-1 Video Calls", subtitle: "Private & personalized sessions" },
              { title: "Trusted & Secure", subtitle: "Safe payments & secure platform" },
              { title: "Top Creators & Experts", subtitle: "Learn from the best in the world" },
            ].map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(124,92,255,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {i === 0 && <span style={{ fontSize: "20px" }}>▶</span>}
                  {i === 1 && <span style={{ fontSize: "20px" }}>🛡️</span>}
                  {i === 2 && <span style={{ fontSize: "20px" }}>⭐</span>}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>{feature.title}</div>
                  <div style={{ fontSize: "13px", color: "#a79fc9" }}>{feature.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", maxWidth: "340px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: "34px", height: "34px", borderRadius: "50%", background: `hsl(${60 + i * 40}, 70%, 50%)`, border: "2px solid #1c0f4a", marginRight: "-10px" }} />
              ))}
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid #1c0f4a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#fff", fontWeight: "700" }}>+</div>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Join 50K+ happy users</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#c9c3e6" }}>
                <span style={{ color: "#fbbf24" }}>★★★★★</span> 4.8/5
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Card */}
        <div style={{ flex: "none", width: "460px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", position: "relative", zIndex: 1 }}>
          <div style={{ width: "100%", maxWidth: "400px", background: "#ffffff", borderRadius: "24px", boxShadow: "0 40px 80px rgba(0,0,0,0.35)", padding: "36px 32px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "28px", borderBottom: "1px solid #ece9f7", marginBottom: "24px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                style={{
                  padding: "14px 0",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  color: activeTab === "login" ? purple : "#8b87a3",
                  borderBottom: activeTab === "login" ? `2px solid ${purple}` : "none",
                  marginBottom: "-1px",
                }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                style={{
                  padding: "14px 0",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  color: activeTab === "signup" ? purple : "#8b87a3",
                  borderBottom: activeTab === "signup" ? `2px solid ${purple}` : "none",
                  marginBottom: "-1px",
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <div>
                <div style={{ marginBottom: "22px" }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#14103a" }}>Welcome back</h2>
                  <p style={{ margin: "0", fontSize: "14px", color: "#8b87a3" }}>Login to keep connecting on Connectiqo.</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {loginError && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#c53030" }}>
                      <AlertCircle size={16} />
                      <span style={{ flex: 1 }}>{loginError}</span>
                      <button type="button" onClick={() => setLoginError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>×</button>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", border: "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                    <Mail size={16} style={{ color: "#9c96b8" }} />
                    <input
                      type="email"
                      placeholder="Email or Phone"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      disabled={loginLoading}
                      style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", border: "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                    <Lock size={16} style={{ color: "#9c96b8" }} />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      disabled={loginLoading}
                      style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={loginLoading}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {showLoginPassword ? <EyeOff size={16} style={{ color: "#9c96b8" }} /> : <Eye size={16} style={{ color: "#9c96b8" }} />}
                    </button>
                  </div>

                  <div style={{ textAlign: "right", fontSize: "13px" }}>
                    <Link href={ROUTES.forgotPassword} style={{ color: purple, textDecoration: "none", fontWeight: "600" }}>
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: "100%",
                      marginTop: "22px",
                      padding: "15px",
                      border: "none",
                      borderRadius: "10px",
                      background: purple,
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: loginLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: loginLoading ? 0.6 : 1,
                    }}
                  >
                    {loginLoading ? "Signing in…" : "Login"}
                  </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "22px 0 16px", color: "#9c96b8", fontSize: "13px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#ece9f7" }} />
                  or continue with
                  <div style={{ flex: 1, height: "1px", background: "#ece9f7" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "11px 12px",
                      border: "1px solid #e6e3f2",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#14103a",
                      cursor: "pointer",
                      background: "#fff",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontWeight: "800", fontSize: "15px", background: "linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>G</span>
                    Google
                  </button>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "11px 12px",
                      border: "1px solid #e6e3f2",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#14103a",
                      cursor: "pointer",
                      background: "#fff",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>󰀵</span>
                    Apple
                  </button>
                </div>

                <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b6785" }}>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    style={{ background: "none", border: "none", color: purple, fontWeight: "700", cursor: "pointer", textDecoration: "none" }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <div>
                <div style={{ marginBottom: "22px" }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#14103a" }}>Create your account</h2>
                  <p style={{ margin: "0", fontSize: "14px", color: "#8b87a3" }}>Join Connectiqo and start connecting!</p>
                </div>

                <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {signupError && (
                    <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#c53030" }}>
                      {signupError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", border: signupErrors.name ? "1px solid #fc8181" : "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                      <User size={16} style={{ color: "#9c96b8" }} />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={signupName}
                        onChange={(e) => {
                          setSignupName(e.target.value);
                          clearSignupError("name");
                        }}
                        disabled={signupLoading}
                        style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", border: signupErrors.email ? "1px solid #fc8181" : "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                      <Mail size={16} style={{ color: "#9c96b8" }} />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={signupEmail}
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          clearSignupError("email");
                        }}
                        disabled={signupLoading}
                        style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", border: signupErrors.phone ? "1px solid #fc8181" : "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                    <Phone size={16} style={{ color: "#9c96b8" }} />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={signupPhone}
                      onChange={(e) => {
                        setSignupPhone(e.target.value);
                        clearSignupError("phone");
                      }}
                      disabled={signupLoading}
                      style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", border: signupErrors.password ? "1px solid #fc8181" : "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                    <Lock size={16} style={{ color: "#9c96b8" }} />
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Create Password"
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        clearSignupError("password");
                      }}
                      disabled={signupLoading}
                      style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={signupLoading}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {showSignupPassword ? <EyeOff size={16} style={{ color: "#9c96b8" }} /> : <Eye size={16} style={{ color: "#9c96b8" }} />}
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", border: signupErrors.confirmPassword ? "1px solid #fc8181" : "1px solid #e6e3f2", borderRadius: "10px", padding: "13px 14px" }}>
                    <Lock size={16} style={{ color: "#9c96b8" }} />
                    <input
                      type={showSignupConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        clearSignupError("confirmPassword");
                      }}
                      disabled={signupLoading}
                      style={{ border: "none", outline: "none", fontSize: "14px", fontFamily: "inherit", flex: 1, color: "#14103a", width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      disabled={signupLoading}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {showSignupConfirmPassword ? <EyeOff size={16} style={{ color: "#9c96b8" }} /> : <Eye size={16} style={{ color: "#9c96b8" }} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading || !agreeToTerms}
                    style={{
                      width: "100%",
                      marginTop: "20px",
                      padding: "15px",
                      border: "none",
                      borderRadius: "10px",
                      background: purple,
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: signupLoading || !agreeToTerms ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: signupLoading || !agreeToTerms ? 0.6 : 1,
                    }}
                  >
                    {signupLoading ? "Creating account…" : "Sign Up"}
                  </button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "22px 0 16px", color: "#9c96b8", fontSize: "13px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#ece9f7" }} />
                  or continue with
                  <div style={{ flex: 1, height: "1px", background: "#ece9f7" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "22px" }}>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "11px 12px",
                      border: "1px solid #e6e3f2",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#14103a",
                      cursor: "pointer",
                      background: "#fff",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontWeight: "800", fontSize: "15px", background: "linear-gradient(90deg,#4285F4,#EA4335,#FBBC05,#34A853)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>G</span>
                    Google
                  </button>
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "11px 12px",
                      border: "1px solid #e6e3f2",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#14103a",
                      cursor: "pointer",
                      background: "#fff",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>󰀵</span>
                    Apple
                  </button>
                </div>

                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "20px", fontSize: "13px", color: "#6b6785", cursor: "pointer", lineHeight: "1.5" }}>
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    disabled={signupLoading}
                    style={{ marginTop: "2px", width: "16px", height: "16px", cursor: "pointer", accentColor: purple, flexShrink: 0 }}
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" style={{ color: purple, textDecoration: "none", fontWeight: "600" }}>
                      Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" style={{ color: purple, textDecoration: "none", fontWeight: "600" }}>
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <div style={{ textAlign: "center", fontSize: "14px", color: "#6b6785" }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    style={{ background: "none", border: "none", color: purple, fontWeight: "700", cursor: "pointer", textDecoration: "none" }}
                  >
                    Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#f6f4fd", padding: "36px 64px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
        {[
          { title: "100% Secure", subtitle: "Your data is safe with us", icon: "🛡️" },
          { title: "24/7 Support", subtitle: "We're here to help", icon: "🎧" },
          { title: "Verified Creators", subtitle: "Quality you can trust", icon: "✓" },
          { title: "Instant Booking", subtitle: "Book and connect instantly", icon: "⚡" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#ece6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "20px" }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#14103a" }}>{item.title}</div>
              <div style={{ fontSize: "13px", color: "#8b87a3" }}>{item.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={null}>
      <UnifiedAuthForm />
    </Suspense>
  );
}
