import "./globals.css";

export const metadata = {
  title: "MovieBook — Book Movie Tickets",
  description: "Browse movies, pick seats and book tickets with MovieBook, a college DBMS project demo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
