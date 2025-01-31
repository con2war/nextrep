import { UserProvider } from '@auth0/nextjs-auth0/client'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitQuest",
  description: "Your personal fitness journey",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
