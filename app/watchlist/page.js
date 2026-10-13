import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import WatchlistPage from "@/components/watchlist-page";
import { requirePageUser } from "@/lib/page-auth";

export const runtime = "nodejs";

export default async function WatchlistRoute() {
  const user = await requirePageUser();
  return (
    <>
      <SiteNav active="watchlist" user={user} />
      <main className="content-page"><WatchlistPage /></main>
      <SiteFooter />
    </>
  );
}
