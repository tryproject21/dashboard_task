import type { Metadata } from "next";
import "./globals.css";
import "./sidebar.css";
import "./dashboard.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";
import NotificationBell from "@/components/NotificationBell";
import AIAssistant from "@/components/AIAssistant";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "ProDash - Professional Self-Management",
  description: "Dashboard for task management, file directory, and schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
            <CommandPalette />
            <NotificationBell />
            <AIAssistant />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
