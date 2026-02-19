import "./globals.css";
import TopBar from "../components/TopBar";
import OffCanvas from "../components/OffCanvas";

export const metadata = { title: "AI App Platform" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <TopBar title="AI App Platform" />
        <OffCanvas />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
