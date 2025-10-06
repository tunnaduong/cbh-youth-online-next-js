"use client";

import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "@/contexts/themeContext";
import viVN from "antd/locale/vi_VN";

export default function AntdProvider({ children }) {
  const { theme } = useTheme();

  const configProviderProps = {
    locale: viVN,
    theme: {
      token: {
        fontFamily: "Inter, sans-serif",
        colorPrimary: "#319527",
        controlHeight: 40,
      },
      components: {
        Input: {
          colorBgContainer: "transparent",
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
          colorTextPlaceholder: "#888",
        },
        Checkbox: {
          colorBgContainer: "transparent",
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
        },
        Button: {
          defaultBg: theme === "dark" ? "#3C3C3C" : "#ffffff", // dark = gray-800, light = white
          colorPrimary: "#319527",
          colorPrimaryHover: "#40b235",
          colorPrimaryActive: "#287421",
          defaultShadow: "none", // bỏ bóng dưới
          primaryShadow: "none", // nếu dùng primary
          defaultHoverBg: theme === "dark" ? "#414642" : "#EBFFF5",
        },
        Modal: {
          colorBgElevated: theme === "dark" ? "#3c3c3c" : "#ffffff",
        },
        Select: {
          colorBgContainer: "transparent",
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
        },
        Radio: {
          colorBgContainer: "transparent",
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
        },
        DatePicker: {
          colorBgContainer: "transparent",
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
        },
        ColorPicker: {
          colorBorder: theme === "dark" ? "#737373" : "#e5e7eb",
        },
      },
      algorithm:
        theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    },
  };

  return <ConfigProvider {...configProviderProps}>{children}</ConfigProvider>;
}
