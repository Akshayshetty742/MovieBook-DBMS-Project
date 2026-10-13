import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="site-footer-brand" href="/">MOVIE<span>BOOK</span></Link>
        <p>Find your next movie night. Reserve your seats with confidence.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/movies">Movies</Link>
        <Link href="/bookings">My bookings</Link>
        <Link href="/account">Account</Link>
      </nav>
      <small>Demo booking project · Payments are simulated; no real transactions are processed.</small>
    </footer>
  );
}
