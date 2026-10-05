"use client";

import { useEffect, useState } from "react";
import { Button, Popconfirm, message } from "antd";
import {
  AppWindow,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Fingerprint,
  KeyRound,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  UserPlus,
} from "lucide-react";
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

// How the login was made (`login_method` from the API; missing on logins
// from before the API recorded it).
const LOGIN_METHODS = {
  password: { label: "Mật khẩu", icon: KeyRound },
  google: { label: "Google", icon: LogIn },
  facebook: { label: "Facebook", icon: LogIn },
  apple: { label: "Apple", icon: LogIn },
  passkey: { label: "Passkey", icon: Fingerprint },
  register: { label: "Đăng ký tài khoản", icon: UserPlus },
  app: { label: "Mở từ ứng dụng di động", icon: Smartphone },
};

const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Có lỗi xảy ra.";

const formatTime = (value) =>
  value ? dayjs(value).format("HH:mm DD/MM/YYYY") : null;

function DetailRow({ icon: Icon, label, value, last }) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${
        last ? "" : "border-b border-gray-200 dark:border-neutral-600"
      }`}
    >
      <Icon className="h-[18px] w-[18px] flex-shrink-0 text-gray-400 dark:text-neutral-400" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * "Logged-in devices" section of the account settings: every device the
 * account is signed in on, with a way to sign the others out. One card per
 * device - the basics first, the rest (model, version, how it logged in,
 * times, log out) when the card is opened.
 */
export default function DeviceSessions() {
  const [sessions, setSessions] = useState(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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

  const renderSession = (session) => {
    const expanded = expandedId === session.id;
    const DeviceIcon = session.platform === "web" ? Monitor : Smartphone;
    const platform = PLATFORM_LABELS[session.platform] || null;
    const method = LOGIN_METHODS[session.login_method] || null;
    const methodText = method
      ? `${method.label}${session.login_two_factor ? " · xác thực hai lớp" : ""}`
      : "Không rõ";
    const summary = [
      platform && session.app_version ? `${platform} ${session.app_version}` : platform,
      formatTime(session.last_used_at || session.created_at),
    ]
      .filter(Boolean)
      .join("  •  ");

    const details = [
      session.device_model && { icon: Cpu, label: "Mẫu thiết bị", value: session.device_model },
      platform && {
        icon: AppWindow,
        label: "Nền tảng",
        value: session.app_version ? `${platform} · phiên bản ${session.app_version}` : platform,
      },
      { icon: method?.icon || LogIn, label: "Phương thức đăng nhập", value: methodText },
      {
        icon: CalendarClock,
        label: "Đăng nhập lúc",
        value: formatTime(session.created_at) || "-",
      },
      {
        icon: Clock,
        label: "Hoạt động lần cuối",
        value: formatTime(session.last_used_at) || "Chưa hoạt động",
      },
    ].filter(Boolean);

    const bodyId = `device-session-${session.id}`;

    return (
      <li
        key={session.id}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-600 dark:bg-neutral-700"
      >
        <button
          type="button"
          onClick={() => setExpandedId(expanded ? null : session.id)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-600">
            <DeviceIcon className="h-6 w-6 text-primary-500 dark:text-[#6bcf60]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-gray-900 dark:text-white">
              {session.device_name || "Thiết bị không xác định"}
            </span>
            {summary && (
              <span className={`${hintClass} block truncate`}>{summary}</span>
            )}
            <span className="mt-2 flex flex-wrap gap-1.5">
              {session.is_current && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Thiết bị này
                </span>
              )}
              {method && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-neutral-600 dark:text-neutral-200">
                  {method.label}
                </span>
              )}
            </span>
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
          )}
        </button>

        {expanded && (
          <div id={bodyId} className="px-4 pb-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 dark:border-neutral-600 dark:bg-neutral-800">
              {details.map((row, index) => (
                <DetailRow key={row.label} {...row} last={index === details.length - 1} />
              ))}
            </div>

            {!session.is_current && (
              <Popconfirm
                title="Đăng xuất thiết bị này?"
                okText="Đăng xuất"
                cancelText="Hủy"
                onConfirm={() => logoutOne(session.id)}
              >
                {/* One at a time: each logout reloads the list. */}
                <Button
                  danger
                  block
                  shape="round"
                  className="mt-3"
                  icon={<LogOut className="h-4 w-4" />}
                  loading={busyId === session.id}
                  disabled={loggingOutAll || (busyId !== null && busyId !== session.id)}
                >
                  Đăng xuất
                </Button>
              </Popconfirm>
            )}
          </div>
        )}
      </li>
    );
  };

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
        <>
          <p className={`${hintClass} mt-4 font-medium`}>
            Tổng số lượt đăng nhập: {total || sessions.length}
          </p>
          <ul className="mt-3 space-y-3">{sessions.map(renderSession)}</ul>
        </>
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
