"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Popconfirm, message } from "antd";
import { CalendarDays, Clock, Coffee, Info, Pencil, Plus, Trash2 } from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { HomeCard, SectionHeader } from "@/components/home/HomeCard";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";
import { useAuthContext } from "@/contexts/Support";
import { getTimetable, getTimetableDemo, resetTimetable, saveTimetable } from "@/app/Api";
import {
  DAYS,
  blockLabel,
  clearGuestTimetable,
  computeStatus,
  formatDuration,
  fromSeconds,
  parseTimetableJson,
  readGuestTimetable,
  sortBlocks,
  todayKey,
  toSeconds,
  withPeriodNumbers,
  writeGuestTimetable,
} from "@/lib/timetable";

const DAY_LONG = { T2: "Thứ Hai", T3: "Thứ Ba", T4: "Thứ Tư", T5: "Thứ Năm", T6: "Thứ Sáu", T7: "Thứ Bảy", CN: "Chủ Nhật" };

const sidebarItems = EXPLORE_FEATURES.map((f) => ({
  key: f.key,
  href: f.href,
  label: f.title,
  Icon: f.sidebarIcon,
  isExternal: false,
}));

const pad = (n) => String(n).padStart(2, "0");

const cloneSchedule = (data) => {
  const out = {};
  DAYS.forEach((d) => {
    out[d] = (data?.[d] || []).map((b) => ({ ...b }));
  });
  return out;
};

const chipClass = (active) =>
  `rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? "bg-primary-500 !text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-500"
  }`;

// "Thời khóa biểu" (like vaolop.app): a live countdown to the next period plus
// the week's schedule, and an editor. Signed-in users keep one schedule on
// their account (shared with the app); guests keep it in this browser.
export default function TimetableClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const [payload, setPayload] = useState(null); // { data, is_demo }
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(null);
  const [day, setDay] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      if (loggedIn) {
        const res = await getTimetable();
        setPayload(res.data);
        return;
      }
      const saved = readGuestTimetable();
      if (saved) {
        setPayload({ data: saved, is_demo: false });
        return;
      }
      const res = await getTimetableDemo();
      setPayload({ data: res.data.data, is_demo: true });
    } catch {
      setLoadError(true);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  // Clock runs on the client only so the server render matches.
  useEffect(() => {
    const first = new Date();
    setNow(first);
    setDay(todayKey(first));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const schedule = payload?.data;
  const status = schedule && now ? computeStatus(schedule, now) : null;

  let content;
  if (loadError) {
    content = (
      <HomeCard className="p-4 sm:p-5">
        <p className="py-6 text-center text-sm text-gray-500 dark:text-neutral-400">
          Không tải được thời khóa biểu. Hãy thử lại.
        </p>
        <div className="flex justify-center">
          <Button shape="round" onClick={load}>
            Thử lại
          </Button>
        </div>
      </HomeCard>
    );
  } else if (!payload || !now) {
    content = (
      <HomeCard className="animate-pulse space-y-4 p-4 sm:p-5">
        <div className="mx-auto h-12 w-48 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="mx-auto h-6 w-40 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-24 w-full rounded bg-gray-200 dark:bg-neutral-600" />
      </HomeCard>
    );
  } else if (editing) {
    content = (
      <TimetableEditor
        initial={schedule}
        loggedIn={loggedIn}
        startDay={day}
        onCancel={() => setEditing(false)}
        onSaved={(next) => {
          setPayload(next);
          setEditing(false);
        }}
      />
    );
  } else {
    content = (
      <>
        {payload.is_demo && (
          <div className="flex items-start gap-2 rounded-xl border border-primary-500 px-3.5 py-3 dark:border-[#6bcf60]">
            <Info className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-primary-500 dark:text-[#6bcf60]" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Đây là lịch mẫu.{" "}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-semibold text-primary-500 hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]"
              >
                Nhập thời khóa biểu của lớp bạn
              </button>
              .
            </p>
          </div>
        )}
        <LiveCard now={now} status={status} />
        <WeekCard schedule={schedule} day={day} setDay={setDay} now={now} status={status} />
        {!loggedIn && (
          <p className="px-1 text-xs text-gray-500 dark:text-gray-400">
            Lịch đang được lưu trên trình duyệt này.{" "}
            <Link href="/login?continue=/explore/timetable" className="font-medium text-primary-500 hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]">
              Đăng nhập
            </Link>{" "}
            để lưu vào tài khoản và dùng chung với ứng dụng CBH Online.
          </p>
        )}
      </>
    );
  }

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="timetable"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      <div className="mx-auto w-full max-w-[775px] px-3 py-6 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Thời khóa biểu</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Xem giờ vào lớp, tiết đang học và thời gian còn lại đến tiết kế tiếp.
            </p>
          </div>
          {payload && !editing && (
            <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Sửa thời khóa biểu
            </Button>
          )}
        </div>
        <div className="mt-6 space-y-4 sm:space-y-5">{content}</div>
      </div>
    </HomeLayout>
  );
}

function LiveCard({ now, status }) {
  const c = status.current;
  let text;
  switch (status.phase) {
    case "in":
      text = c.type === "nghi" ? blockLabel(c) : `Đang học tiết ${c.period}: ${c.subject}`;
      break;
    case "before":
      text = "Chưa vào học";
      break;
    case "between":
      // A long gap is the lunch break between the two sessions.
      text = status.remaining > 20 * 60 ? "Nghỉ giữa buổi" : "Chuyển tiết";
      break;
    case "after":
      text = "Đã hết giờ học";
      break;
    default:
      text = "Hôm nay không có lịch học";
  }

  let nextText = "Hết giờ học hôm nay";
  if (status.next) {
    nextText = status.next.type === "nghi" ? blockLabel(status.next) : `Tiết ${status.next.period}: ${status.next.subject}`;
  } else if (c) {
    nextText = c.type === "nghi" ? "Hết giờ nghỉ" : "Hết tiết học";
  }

  const inLesson = status.phase === "in" && c.type === "hoc";
  const pill = inLesson
    ? "bg-primary-50 text-primary-600 dark:bg-[#2b3a2a] dark:text-[#86dc7c]"
    : status.phase === "in"
    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-gray-100 text-gray-600 dark:bg-neutral-600 dark:text-neutral-200";
  const bar = inLesson ? "bg-primary-500 dark:bg-[#6bcf60]" : "bg-amber-500 dark:bg-amber-400";

  return (
    <HomeCard className="p-4 sm:p-5">
      <div className="flex flex-col items-center text-center">
        <p className="text-5xl font-extrabold tabular-nums text-gray-900 dark:text-white sm:text-6xl">
          {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{DAY_LONG[todayKey(now)]}</p>
        <span className={`mt-4 max-w-full truncate rounded-full px-4 py-1.5 text-[15px] font-semibold ${pill}`}>{text}</span>
      </div>
      {c && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-600">
            <div className={`h-full ${bar}`} style={{ width: `${Math.round(status.progress * 100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-500 dark:text-gray-400">
            <span>{c.start}</span>
            <span>{c.end}</span>
          </div>
        </div>
      )}
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Stat label="Thời gian đã trôi qua" value={status.elapsed != null ? formatDuration(status.elapsed) : "--:--"} />
        <Stat label="Giờ kế tiếp" value={nextText} small />
        <Stat
          label={status.next ? "Còn lại trước giờ kế tiếp" : "Thời gian còn lại"}
          value={status.remaining != null ? formatDuration(status.remaining) : "--:--"}
        />
      </div>
    </HomeCard>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-neutral-800">
      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-0.5 font-bold tabular-nums text-gray-900 dark:text-white ${small ? "text-base leading-snug" : "text-2xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function WeekCard({ schedule, day, setDay, now, status }) {
  const today = todayKey(now);
  const blocks = withPeriodNumbers(schedule[day]);
  return (
    <HomeCard className="p-4 sm:p-5">
      <SectionHeader icon={CalendarDays} title="Lịch trong tuần" />
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === day}
            onClick={() => setDay(d)}
            className={chipClass(d === day)}
          >
            {d === "CN" ? "CN" : d}
            {d === today ? " •" : ""}
          </button>
        ))}
      </div>
      {blocks.length ? (
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-neutral-600">
          {blocks.map((b, i) => {
            const running =
              day === today && status.current && status.current.start === b.start && status.current.end === b.end;
            return (
              <li
                key={`${b.start}-${i}`}
                className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${running ? "bg-primary-50 dark:bg-[#2b3a2a]" : ""}`}
              >
                <div className="w-14 flex-shrink-0 tabular-nums">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.start}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.end}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[15px] ${
                      b.type === "hoc"
                        ? "font-medium text-gray-900 dark:text-neutral-100"
                        : "italic text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {blockLabel(b)}
                  </p>
                  {b.period && <p className="text-xs text-gray-500 dark:text-gray-400">Tiết {b.period}</p>}
                </div>
                {running && (
                  <span className="flex-shrink-0 rounded-full bg-primary-500 px-2.5 py-0.5 text-xs font-medium text-white">
                    Đang diễn ra
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400">Chưa có lịch cho {DAY_LONG[day]}.</p>
      )}
    </HomeCard>
  );
}

function TimetableEditor({ initial, loggedIn, startDay, onCancel, onSaved }) {
  const [draft, setDraft] = useState(() => cloneSchedule(initial));
  const [day, setDay] = useState(startDay || "T2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [showJson, setShowJson] = useState(false);

  const blocks = draft[day] || [];

  const update = (fn) => {
    setDraft((prev) => {
      const next = cloneSchedule(prev);
      fn(next);
      return next;
    });
    setError("");
  };

  const addBlock = (type) =>
    update((d) => {
      const list = sortBlocks(d[day]);
      const last = list[list.length - 1];
      const start = last ? toSeconds(last.end) + (type === "hoc" ? 5 * 60 : 0) : 7 * 3600;
      const length = (type === "hoc" ? 45 : 20) * 60;
      d[day] = [
        ...list,
        type === "hoc"
          ? { type, start: fromSeconds(start), end: fromSeconds(start + length), subject: "" }
          : { type, start: fromSeconds(start), end: fromSeconds(start + length), label: "Ra chơi" },
      ];
    });

  const setField = (index, field, value) =>
    update((d) => {
      const b = d[day][index];
      if (field === "start" && value) {
        // Moving the start keeps the period's length.
        const length = toSeconds(b.end) - toSeconds(b.start);
        b.start = value;
        if (length > 0) b.end = fromSeconds(toSeconds(value) + length);
        return;
      }
      if (field === "type") {
        b.type = value;
        if (value === "nghi" && !b.label) b.label = "Ra chơi";
        if (value === "hoc" && b.subject === undefined) b.subject = "";
        return;
      }
      b[field] = value;
    });

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (loggedIn) {
        const res = await saveTimetable(draft);
        onSaved(res.data);
      } else {
        const cleaned = {};
        DAYS.forEach((d) => {
          cleaned[d] = sortBlocks(draft[d]);
        });
        writeGuestTimetable(cleaned);
        onSaved({ data: cleaned, is_demo: false });
      }
      message.success("Đã lưu thời khóa biểu.");
    } catch (err) {
      setError(err?.response?.data?.message || "Không lưu được, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const restoreDemo = async () => {
    try {
      if (loggedIn) {
        const res = await resetTimetable();
        onSaved(res.data);
      } else {
        clearGuestTimetable();
        const res = await getTimetableDemo();
        onSaved({ data: res.data.data, is_demo: true });
      }
      message.success("Đã khôi phục lịch mẫu.");
    } catch (err) {
      message.error(err?.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  const importJson = () => {
    const parsed = parseTimetableJson(jsonText);
    if (!parsed) {
      message.error("JSON không hợp lệ.");
      return;
    }
    setDraft(cloneSchedule(parsed));
    message.info("Đã nhập, bấm Lưu để lưu lại.");
  };

  const counts = useMemo(() => Object.fromEntries(DAYS.map((d) => [d, (draft[d] || []).length])), [draft]);

  return (
    <HomeCard className="p-4 sm:p-5">
      <SectionHeader icon={Clock} title="Sửa thời khóa biểu" />
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Thêm tiết học và giờ ra chơi cho từng ngày.
        {loggedIn ? " Lịch được lưu vào tài khoản, dùng chung trên web và ứng dụng." : " Lịch được lưu trên trình duyệt này."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist">
        {DAYS.map((d) => (
          <button key={d} type="button" role="tab" aria-selected={d === day} onClick={() => setDay(d)} className={chipClass(d === day)}>
            {d} · {counts[d]}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {blocks.map((b, index) => (
          <li
            key={index}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-600 dark:bg-neutral-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["hoc", "Tiết học"],
                ["nghi", "Ra chơi"],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={b.type === type}
                  onClick={() => setField(index, "type", type)}
                  className={chipClass(b.type === type)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                aria-label="Xóa dòng này"
                onClick={() => update((d) => d[day].splice(index, 1))}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  aria-label="Giờ bắt đầu"
                  value={b.start}
                  onChange={(e) => setField(index, "start", e.target.value)}
                  className="!w-[7.5rem]"
                />
                <span className="text-gray-400 dark:text-neutral-400">→</span>
                <Input
                  type="time"
                  aria-label="Giờ kết thúc"
                  value={b.end}
                  onChange={(e) => setField(index, "end", e.target.value)}
                  className="!w-[7.5rem]"
                />
              </div>
              <div className="hidden sm:block" />
              <Input
                value={b.type === "nghi" ? b.label || "" : b.subject || ""}
                onChange={(e) => setField(index, b.type === "nghi" ? "label" : "subject", e.target.value)}
                placeholder={b.type === "nghi" ? "Ra chơi" : "Tên môn học"}
                maxLength={60}
              />
            </div>
          </li>
        ))}
        {!blocks.length && (
          <li className="py-8 text-center text-sm text-gray-500 dark:text-neutral-400">Chưa có lịch cho {DAY_LONG[day]}.</li>
        )}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => addBlock("hoc")}>
          Thêm tiết
        </Button>
        <Button icon={<Coffee className="h-4 w-4" />} onClick={() => addBlock("nghi")}>
          Thêm giờ nghỉ
        </Button>
        <Popconfirm
          title={`Xóa hết lịch ${DAY_LONG[day]}?`}
          description="Thay đổi chỉ được lưu khi bạn bấm Lưu."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => update((d) => (d[day] = []))}
        >
          <Button danger>Xóa hết ngày này</Button>
        </Popconfirm>
      </div>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-neutral-600">
        <Button type="primary" loading={saving} onClick={save}>
          Lưu
        </Button>
        <Button onClick={onCancel}>Hủy</Button>
        <Popconfirm
          title="Khôi phục lịch mẫu?"
          description="Thời khóa biểu đã lưu sẽ bị thay bằng lịch mẫu."
          okText="Khôi phục"
          cancelText="Hủy"
          onConfirm={restoreDemo}
        >
          <Button>Khôi phục lịch mẫu</Button>
        </Popconfirm>
        <Button type="link" aria-expanded={showJson} onClick={() => setShowJson((v) => !v)}>
          Xuất / nhập JSON
        </Button>
      </div>

      {showJson && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-neutral-600 dark:bg-neutral-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sao lưu hoặc chia sẻ lịch. Dùng được với JSON xuất từ vaolop.app.
          </p>
          <Input.TextArea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={8}
            className="mt-2 font-mono !text-xs"
            placeholder='{"T2": [{"type": "hoc", "start": "07:00", "end": "07:45", "subject": "Toán"}]}'
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => setJsonText(JSON.stringify(draft, null, 2))}>Xuất ra ô trên</Button>
            <Button
              onClick={async () => {
                const text = JSON.stringify(draft, null, 2);
                setJsonText(text);
                try {
                  await navigator.clipboard.writeText(text);
                  message.success("Đã sao chép JSON.");
                } catch {
                  message.info("Hãy sao chép JSON trong ô trên.");
                }
              }}
            >
              Sao chép
            </Button>
            <Button onClick={importJson} disabled={!jsonText.trim()}>
              Nhập từ ô trên
            </Button>
          </div>
        </div>
      )}
    </HomeCard>
  );
}
