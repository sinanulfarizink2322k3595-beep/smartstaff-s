import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { RealtimeProvider, RealtimeStatusMonitor, RealtimeSyncNotification } from "@/components/realtime/status-monitor";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StaffHub - Staff Availability & Outpass Management",
  description: "Multi-tenant SaaS for managing staff availability, outpass requests, and campus operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <RealtimeProvider>
              {children}
              <RealtimeStatusMonitor />
              <RealtimeSyncNotification />
              <Toaster />
            </RealtimeProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
