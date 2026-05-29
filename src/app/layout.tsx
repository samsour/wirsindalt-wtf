import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "wirsindalt.wtf — Abitur 2016 · 10 Jahre Treffen",
  description: "10 Jahre. Zeit für eine Party. Stimm ab, wann du kannst.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
