import { UserProvider } from '@auth0/nextjs-auth0/client'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextRep AI",
  description: "AI-Powered Workout Generator",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <div className="pb-16"> {/* Add padding to account for fixed bottom nav */}
            {children}
          </div>
          <BottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
