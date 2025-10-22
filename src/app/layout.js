import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { CacheProvider } from "@/lib/cache-context";
import LayoutWrapper from "@/components/layout/layout-wrapper";
import DisablePullRefresh from "@/components/disable-pull-refresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Log Life - 记录生活的每一天",
  description: "一款面向个人用户的日志记录应用，帮助您记录日常生活轨迹，包括饮食、运动、心情等各类信息，并提供记账及统计功能。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CacheProvider>
            <DisablePullRefresh />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Navigation />
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
