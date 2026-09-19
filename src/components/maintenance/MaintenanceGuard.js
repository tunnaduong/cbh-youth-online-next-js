"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MaintenanceScreen from "./MaintenanceScreen";
import { API_DOWN_EVENT, checkApiAlive } from "./apiStatus";

const POLL_INTERVAL = 15000;

// Lắng nghe tín hiệu API down từ axios, xác nhận lại bằng health check,
// hiện màn hình bảo trì và tự tải lại trang khi API sống lại.
export default function MaintenanceGuard({ initialDown = false, reloadOnRecover = true }) {
  const [down, setDown] = useState(initialDown);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const verify = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    const alive = await checkApiAlive();
    checkingRef.current = false;
    setChecking(false);
    setDown((wasDown) => {
      if (wasDown && alive && reloadOnRecover) window.location.reload();
      return !alive;
    });
  }, [reloadOnRecover]);

  useEffect(() => {
    window.addEventListener(API_DOWN_EVENT, verify);
    return () => window.removeEventListener(API_DOWN_EVENT, verify);
  }, [verify]);

  useEffect(() => {
    if (!down) return;
    const id = setInterval(verify, POLL_INTERVAL);
    window.addEventListener("online", verify);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", verify);
    };
  }, [down, verify]);

  if (!down) return null;
  return <MaintenanceScreen onRetry={verify} checking={checking} />;
}
