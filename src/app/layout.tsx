import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import { connection } from "next/server";
import { InstallPrompt } from "@/features/pwa/InstallPrompt";
import { Preferences } from "@/features/settings/Preferences";
import "@/styles/globals.css";
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Ocnif — Security, with evidence",
  description:
    "Your coordinated AI security team. Investigate supplied evidence, review findings and stay in control.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ocnif",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060c0d",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html
      lang="en"
      data-theme="dark"
      className={urbanist.variable}
      suppressHydrationWarning
    >
      <body>
        <Preferences>
          {children}
          <InstallPrompt />
        </Preferences>
      </body>
    </html>
  );
}
