"use client";

import { useEffect, useState } from "react";
import { Button, Popconfirm, message } from "antd";
import { Monitor, Smartphone } from "lucide-react";
import dayjs from "dayjs";
import {
  getDeviceSessions,
  logoutDeviceSession,
  logoutOtherDeviceSessions,
} from "@/app/Api";

const PLATFORM_LABELS = {
  web: "Web",
  ios: "Ứng dụng iOS",
  android: "Ứng dụng Android",
};

const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Có lỗi xảy ra.";

function describe(session) {
  const platform = PLATFORM_LABELS[session.platform];
  const version = session.app_version ? ` ${session.app_version}` : "";
  return [session.device_model, platform ? `${platform}${version}` : null]
    .filter(Boolean)
    .join(" · ");
}

/**
 * "Logged-in devices" section of the account settings: every device the
 * account is signed in on, with a way to sign the others out.
 */
export default function DeviceSessions() {
  const [sessions, setSessions] = useState(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const load = async () => {
    try {
      const res = await getDeviceSessions();
      setSessions(res.data.sessions || []);
      setTotal(res.data.total || 0);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logoutOne = async (id) => {
    setBusyId(id);
    try {
      const res = await logoutDeviceSession(id);
      message.success(res.data?.message || "Đã đăng xuất thiết bị.");
      await load();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const logoutOthers = async () => {
    setLoggingOutAll(true);
    try {
      const res = await logoutOtherDeviceSessions();
      message.success(res.data?.message || "Đã đăng xuất khỏi tất cả thiết bị khác.");
      await load();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setLoggingOutAll(false);
    }
  };

  const hintClass = "text-sm text-gray-500 dark:text-gray-400";
  const others = (sessions || []).filter((session) => !session.is_current);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Thiết bị đã đăng nhập
          </h3>
          <p className={hintClass}>
            Những nơi tài khoản của bạn đang đăng nhập. Nếu thấy thiết bị lạ,
            hãy đăng xuất thiết bị đó và đổi mật khẩu.
          </p>
        </div>
        {others.length > 0 && (
          <Popconfirm
            title="Đăng xuất tất cả thiết bị khác?"
            description="Thiết bị bạn đang dùng vẫn được giữ đăng nhập."
            okText="Đăng xuất"
            cancelText="Hủy"
            onConfirm={logoutOthers}
          >
            <Button danger loading={loggingOutAll}>
              Đăng xuất tất cả thiết bị khác
            </Button>
          </Popconfirm>
        )}
      </div>

      {loadError && (
        <p className={`${hintClass} mt-4`}>
          Không tải được danh sách thiết bị. Hãy tải lại trang.
        </p>
      )}

      {!loadError && sessions === null && (
        <p className={`${hintClass} mt-4`}>Đang tải...</p>
      )}

      {sessions && (
        <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
          {sessions.map((session) => {
            const Icon = session.platform === "web" ? Monitor : Smartphone;
            const details = describe(session);
            return (
              <li key={session.id} className="flex items-center gap-3 py-3">
                <Icon className="h-6 w-6 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {session.device_name || "Thiết bị không xác định"}
                    {session.is_current && (
                      <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        Thiết bị này
                      </span>
                    )}
                  </p>
                  {details && <p className={`${hintClass} truncate`}>{details}</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.last_used_at
                      ? `Hoạt động lần cuối: ${dayjs(session.last_used_at).format("HH:mm DD/MM/YYYY")}`
                      : `Đăng nhập lúc: ${dayjs(session.created_at).format("HH:mm DD/MM/YYYY")}`}
                  </p>
                </div>
                {!session.is_current && (
                  <Button
                    size="small"
                    loading={busyId === session.id}
                    onClick={() => logoutOne(session.id)}
                  >
                    Đăng xuất
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {sessions && total > sessions.length && (
        <p className={`${hintClass} mt-2`}>
          Đang hiển thị {sessions.length} trên {total} lượt đăng nhập gần
          nhất. Nút đăng xuất tất cả áp dụng cho cả những lượt không hiển thị.
        </p>
      )}
    </div>
  );
}
