"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SiteNav({ active = "home", user }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to sign out.");
      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError.message || "Unable to sign out. Try again.");
      setLoggingOut(false);
    }
  }

  const activeNav = active === "watchlist" ? "watchlist" : active;
  return (
    <>
      <header className="site-header">
        <Link className="site-brand" href="/" aria-label="MovieBook home">
          MOVIE<span>BOOK</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link className={activeNav === "home" ? "active" : ""} href="/">Home</Link>
          <Link className={activeNav === "movies" ? "active" : ""} href="/movies">Movies</Link>
          <Link className={activeNav === "bookings" ? "active" : ""} href="/bookings">My Bookings</Link>
          <Link className={activeNav === "watchlist" ? "active" : ""} href="/watchlist">Saved</Link>
          <Link className={activeNav === "account" ? "active" : ""} href="/account">Account</Link>
        </nav>
        <div className="site-nav-user">
          {user?.name && <span className="nav-user-name">{user.name}</span>}
          <button type="button" className="nav-logout" disabled={loggingOut} onClick={logout}>
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </header>
      {error && <p className="nav-error" role="alert">{error}</p>}
    </>
  );
}
