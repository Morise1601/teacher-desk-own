import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavigationProgress from "@/app/shared/NavigationProgress";
import UserStatusTracker from "@/app/shared/UserStatusTracker";
import MessagePopupWrapper from "@/app/shared/MessagePopupWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MaintenanceGuard from "@/app/shared/MaintenanceGuard";
import AuthGuard from "@/app/shared/AuthGuard";
import { ThemeProvider } from "@/app/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeacherDesk - Global Educator Network",
  description: "TeacherDesk connects educators, researchers, and institutions globally.",
  icons: {
    icon: [
      { url: '/images/App_logo_light.webp', type: 'image/webp' },
      { url: '/images/App_logo_dark.webp', media: '(prefers-color-scheme: dark)', type: 'image/webp' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/images/App_logo_light.webp',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link href="https://fonts.cdnfonts.com/css/life-lt-roman" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/br-cobane" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/oswald-4" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Outfit:wght@400;500&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="antialiased bg-[#eeeeee] dark:bg-[#0b1120] dark:text-slate-100 h-full transition-colors duration-200"
      >
        <ThemeProvider>
          {/* Global navigation progress bar — visible on every route change */}
          <NavigationProgress />
          <UserStatusTracker />
          <MessagePopupWrapper />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover draggable />
          <MaintenanceGuard>
            <AuthGuard>
              {children}
            </AuthGuard>
          </MaintenanceGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
