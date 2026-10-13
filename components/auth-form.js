"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (isRegister && values.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (isRegister && values.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.error || "Unable to authenticate. Please try again.");
      }
      router.replace("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || "Unable to reach the account service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <Link className="auth-brand" href="/" aria-label="MovieBook home">
        MOVIE<span>BOOK</span>
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-kicker">YOUR NEXT MOVIE NIGHT STARTS HERE</p>
        <h1 id="auth-title">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-subtitle">
          {isRegister
            ? "Join MovieBook to find films and reserve your seats."
            : "Sign in to discover movies and manage your bookings."}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="auth-field">
              <span>Full name</span>
              <input
                autoComplete="name"
                maxLength={100}
                minLength={2}
                required
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
              />
            </label>
          )}
          <label className="auth-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="email"
              maxLength={100}
              required
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                maxLength={256}
                minLength={isRegister ? 8 : undefined}
                required
                value={values.password}
                onChange={(event) => setValues({ ...values, password: event.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {isRegister && <small>Use at least 8 characters.</small>}
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to MovieBook?"}{" "}
          <Link href={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
      </section>
      <p className="auth-disclaimer">A movie discovery and ticket booking experience.</p>
    </main>
  );
}
