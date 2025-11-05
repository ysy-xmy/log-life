import "./globals.css";
import TabContainer from "@/components/layout/tab-container";
import { AuthProvider } from "@/lib/auth-context";
import { CacheProvider } from "@/lib/cache-context";
import LayoutWrapper from "@/components/layout/layout-wrapper";
import DisablePullRefresh from "@/components/disable-pull-refresh";

export const metadata = {
  title: "Log Life - 记录生活的每一天",
  description: "一款面向个人用户的日志记录应用，帮助您记录日常生活轨迹，包括饮食、运动、心情等各类信息，并提供记账及统计功能。",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CacheProvider>
            <DisablePullRefresh />
            <TabContainer>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </TabContainer>
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
