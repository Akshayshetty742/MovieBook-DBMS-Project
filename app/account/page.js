import SiteNav from "@/components/site-nav";
import Link from "next/link";
import { requirePageUser } from "@/lib/page-auth";
import SiteFooter from "@/components/site-footer";

export const runtime = "nodejs";

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <SiteNav active="account" user={user} />
      <main className="content-page account-page">
        <section className="page-heading">
          <p className="section-eyebrow">YOUR PROFILE</p>
          <h1>Account</h1>
          <p>Personal account information associated with your MovieBook bookings.</p>
        </section>
        <section className="profile-card" aria-label="Account profile">
          <div className="profile-avatar" aria-hidden="true">{user.name?.trim().charAt(0)?.toUpperCase() || "M"}</div>
          <div><span>Full name</span><strong>{user.name}</strong></div>
          <div><span>Email address</span><strong>{user.email}</strong></div>
          <div><span>Account type</span><strong>{user.role === "CUSTOMER" ? "Customer" : user.role}</strong></div>
          <Link className="btn-secondary" href="/bookings">View my bookings</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
