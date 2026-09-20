"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Layout, Menu, Button, ConfigProvider, Drawer, Avatar, Dropdown, Grid, theme as antdTheme, Tooltip } from "antd";
import viVN from "antd/locale/vi_VN";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/themeContext";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import {
  DashboardOutlined,
  FlagOutlined,
  FileTextOutlined,
  CommentOutlined,
  UserOutlined,
  DownloadOutlined,
  UploadOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  NotificationOutlined,
  MessageOutlined,
  LogoutOutlined,
  MenuOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Sider, Content, Header } = Layout;

export const ADMIN_SESSION_KEY = "cbh_admin_session";

const BRAND = "#319527";

// The brand green is tuned for white backgrounds and doesn't carry enough
// contrast against near-black ones, so dark mode gets a brighter variant.
const BRAND_DARK = "#4cb93f";

// Nearly everything inside the shell is antd (tables, cards, modals, inputs,
// dropdowns), so switching the algorithm does most of the dark-mode work on
// its own - these tokens only restyle the surfaces the admin layout itself
// defines on top of that.
const adminTheme = (isDark) => ({
  algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: isDark ? BRAND_DARK : BRAND,
    colorLink: isDark ? BRAND_DARK : BRAND,
    borderRadius: 10,
    colorBgLayout: isDark ? "#171917" : "#f4f6f5",
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: isDark ? "rgba(31,34,31,0.85)" : "rgba(255,255,255,0.85)",
      siderBg: isDark ? "#1f221f" : "#ffffff",
      headerHeight: 64,
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: isDark ? "#2a3d27" : "#e9f5e7",
      itemSelectedColor: isDark ? BRAND_DARK : BRAND,
      itemHoverBg: isDark ? "#2a2e2a" : "#f3f7f2",
      itemBorderRadius: 8,
      itemHeight: 40,
      groupTitleColor: isDark ? "#6b7280" : "#9ca3af",
      groupTitleFontSize: 11,
    },
    Card: { paddingLG: 20 },
    Table: {
      headerBg: isDark ? "#242724" : "#fafbfa",
      headerColor: isDark ? "#9ca3af" : "#6b7280",
      rowHoverBg: isDark ? "#242724" : "#f7faf6",
    },
  },
});

export const NAV_GROUPS = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Tổng quan" },
  {
    label: "NỘI DUNG",
    children: [
      { key: "/admin/posts", icon: <FileTextOutlined />, label: "Bài viết" },
      { key: "/admin/comments", icon: <CommentOutlined />, label: "Bình luận" },
      { key: "/admin/reports", icon: <FlagOutlined />, label: "Báo cáo" },
      { key: "/admin/study-materials", icon: <BookOutlined />, label: "Tài liệu học tập" },
    ],
  },
  {
    label: "NGƯỜI DÙNG & VÍ",
    children: [
      { key: "/admin/users", icon: <UserOutlined />, label: "Người dùng" },
      { key: "/admin/messages", icon: <MessageOutlined />, label: "Tin nhắn" },
      { key: "/admin/notifications", icon: <NotificationOutlined />, label: "Gửi thông báo" },
      { key: "/admin/deposits", icon: <DownloadOutlined />, label: "Nạp tiền" },
      { key: "/admin/withdrawals", icon: <UploadOutlined />, label: "Rút tiền" },
    ],
  },
  {
    label: "CỬA HÀNG",
    children: [
      { key: "/admin/shop/orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
      { key: "/admin/shop/products", icon: <ShopOutlined />, label: "Sản phẩm" },
      { key: "/admin/shop/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
      { key: "/admin/student-verifications", icon: <SafetyCertificateOutlined />, label: "Xác minh HS" },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.children || [g]);

const toItem = ({ key, icon, label }) => ({ key, icon, label: <Link href={key}>{label}</Link> });

function SidebarContent({ selectedKey, onNavigate }) {
  const items = NAV_GROUPS.map((g) =>
    g.children ? { type: "group", key: g.label, label: g.label, children: g.children.map(toItem) } : toItem(g)
  );

  return (
    <div className="flex flex-col h-full">
      <Link href="/admin" className="flex items-center gap-3 px-5 h-16 shrink-0" onClick={onNavigate}>
        <Image src="/images/logo.png" alt="CBH" width={34} height={34} />
        <div className="leading-tight">
          <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">CBH Admin</div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">Chuyên Biên Hòa Online</div>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={onNavigate}
          style={{ border: "none" }}
        />
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-neutral-700">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700 hover:text-gray-800 dark:hover:text-gray-100"
        >
          <HomeOutlined /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const screens = Grid.useBreakpoint();
  const [authed, setAuthed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [me, setMe] = useState(null);
  // Shares the site-wide theme setting (and its localStorage key) rather than
  // keeping a separate admin-only preference, so flipping it here or on the
  // main site follows you both ways.
  const { changeTheme } = useTheme();
  const isDark = useIsDarkMode();
  // Set explicitly off what's currently on screen instead of using
  // toggleTheme(), which assumes the setting is already "light" or "dark" -
  // from "auto" on a light OS it would pick "light" again and appear to do
  // nothing.
  const flipTheme = () => changeTheme(isDark ? "light" : "dark");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!session) {
      router.replace("/admin/login");
    } else {
      setAuthed(true);
      try {
        setMe(JSON.parse(localStorage.getItem("CURRENT_USER") || "null"));
      } catch {
        setMe(null);
      }
    }
  }, [router, isLoginPage]);

  if (isLoginPage)
    return (
      <ConfigProvider theme={adminTheme(isDark)} locale={viVN}>
        {children}
      </ConfigProvider>
    );
  if (!authed) return null;

  // Longest nav key that prefixes the current path.
  const current =
    ALL_ITEMS.filter((i) => pathname === i.key || pathname.startsWith(i.key + "/")).sort(
      (a, b) => b.key.length - a.key.length
    )[0] || ALL_ITEMS[0];

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    router.replace("/admin/login");
  };

  const isDesktop = screens.lg !== false;
  const displayName = me?.profile_name || me?.username || "Quản trị viên";

  return (
    <ConfigProvider theme={adminTheme(isDark)} locale={viVN}>
      <Layout style={{ minHeight: "100vh" }}>
        {isDesktop ? (
          <Sider
            width={248}
            theme={isDark ? "dark" : "light"}
            style={{
              borderRight: `1px solid ${isDark ? "#2a2e2a" : "#eef0ee"}`,
              position: "sticky",
              top: 0,
              height: "100vh",
            }}
          >
            <SidebarContent selectedKey={current.key} />
          </Sider>
        ) : (
          <Drawer
            placement="left"
            width={264}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            closable={false}
            styles={{ body: { padding: 0 } }}
          >
            <SidebarContent selectedKey={current.key} onNavigate={() => setDrawerOpen(false)} />
          </Drawer>
        )}

        <Layout>
          <Header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              backdropFilter: "blur(8px)",
              borderBottom: `1px solid ${isDark ? "#2a2e2a" : "#eef0ee"}`,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {!isDesktop && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#e9f5e7] text-[#319527] dark:bg-[#2a3d27] dark:text-[#4cb93f] flex items-center justify-center shrink-0">
                {current.icon}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {current.label}
              </span>
            </div>
            <div className="flex-1" />
            <Tooltip title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}>
              <Button
                type="text"
                aria-label="Đổi giao diện sáng/tối"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={flipTheme}
              />
            </Tooltip>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "home", icon: <HomeOutlined />, label: <Link href="/">Trang chủ</Link> },
                  { type: "divider" },
                  { key: "logout", icon: <LogoutOutlined />, danger: true, label: "Đăng xuất", onClick: logout },
                ],
              }}
            >
              <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 dark:hover:bg-neutral-700 dark:hover:bg-neutral-700 transition-colors">
                <Avatar
                  size={32}
                  src={
                    me?.username
                      ? `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${me.username}/avatar`
                      : undefined
                  }
                  style={{ background: isDark ? BRAND_DARK : BRAND }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                {screens.sm && (
                  <span className="text-sm text-gray-700 dark:text-gray-200 font-medium max-w-[140px] truncate">
                    {displayName}
                  </span>
                )}
              </button>
            </Dropdown>
          </Header>
          <Content>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
