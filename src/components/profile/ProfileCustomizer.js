"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ColorPicker, Modal, Skeleton, message } from "antd";
import { ImagePlus, Lock, Plus } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";
import StyledName from "@/components/profile/StyledName";
import ProfilePreviewCard from "@/components/profile/ProfilePreviewCard";
import PointsMilestones from "@/components/profile/PointsMilestones";
import OptionPickerModal from "@/components/profile/OptionPickerModal";
import NameStyleModal from "@/components/profile/NameStyleModal";
import ProfileEffect from "@/components/profile/ProfileEffect";
import ProfileFrame from "@/components/profile/ProfileFrame";
import { getProfile, updateAvatar, updateCover, updateProfile } from "@/app/Api";
import {
  DEFAULT_ACCENT,
  DEFAULT_PRIMARY,
  OPTION_LABELS,
} from "@/lib/profileTheme";

const DEFAULT_THEME = {
  primary_color: null,
  accent_color: null,
  banner_color: null,
  name_font: "default",
  name_effect: "none",
  name_colors: [DEFAULT_PRIMARY, DEFAULT_ACCENT],
  avatar_frame: "none",
  profile_effect: "none",
  profile_frame: "none",
};

const OPTION_FIELDS = ["name_font", "name_effect", "avatar_frame", "profile_effect", "profile_frame"];

const sameTheme = (a, b) =>
  Object.keys(DEFAULT_THEME).every(
    (key) => JSON.stringify(a?.[key]) === JSON.stringify(b?.[key])
  );

// A saved theme can hold options the user is no longer ranked high enough
// for (their points dropped). Start editing from what others actually see,
// so the save bar only ever reflects what the user changes now.
const withoutLockedOptions = (theme, editor) =>
  OPTION_FIELDS.reduce((result, field) => {
    const option = editor.options[field].find((o) => o.key === theme[field]);
    if (editor.can_customize && option && !option.unlocked) {
      result[field] = DEFAULT_THEME[field];
    }
    return result;
  }, { ...theme });

const pickHex = (color) => color.toHexString().slice(0, 7).toLowerCase();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function Section({ title, children }) {
  return (
    <section className="py-4 border-b border-gray-200 dark:border-neutral-600 last:border-b-0">
      <h4 className="mb-2.5 text-sm font-semibold text-gray-800 dark:text-neutral-200">{title}</h4>
      {children}
    </section>
  );
}

// Big square-ish button used for every slot in the sidebar (Discord style).
function Slot({ label, onClick, disabled, children, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-700 hover:ring-2 hover:ring-primary-500 transition disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function AddIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow">
      <Plus className="w-5 h-5" />
    </span>
  );
}

/**
 * Trình chỉnh sửa giao diện trang cá nhân, bố cục theo Discord:
 * cột trái là các mục chỉnh, giữa là thẻ profile xem trực tiếp, phải là
 * mốc điểm. Thanh "Đừng quên lưu thay đổi!" hiện khi có thay đổi, và chặn
 * rời trang cho tới khi lưu hoặc đặt lại.
 */
export default function ProfileCustomizer({ username }) {
  const [profile, setProfile] = useState(null);
  const [editor, setEditor] = useState(null);
  const [saved, setSaved] = useState(DEFAULT_THEME);
  const [draft, setDraft] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [picker, setPicker] = useState(null);
  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  const load = useCallback(async () => {
    const response = await getProfile(username);
    const data = response.data;
    const state = data?.profile?.theme_editor || null;
    setProfile(data);
    setEditor(state);
    return state;
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    load()
      .then((state) => {
        if (cancelled) return;
        const current = state?.saved
          ? withoutLockedOptions(state.saved, state)
          : DEFAULT_THEME;
        setSaved(current);
        setDraft(current);
      })
      .catch((error) => {
        console.error("Error loading profile customization:", error);
        if (!cancelled) message.error("Không thể tải dữ liệu. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, load]);

  const dirty = !sameTheme(draft, saved);

  // Like Discord: while there are unsaved changes, leaving is blocked and the
  // save bar shakes instead - for in-app links as well as closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e) => {
      const link = e.target.closest?.("a[href]");
      if (!link || link.target === "_blank") return;
      e.preventDefault();
      e.stopPropagation();
      setShakeCount((n) => n + 1);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!shakeCount) return;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(timer);
  }, [shakeCount]);

  if (loading) {
    return <Skeleton active avatar paragraph={{ rows: 8 }} />;
  }

  if (!editor || !profile) {
    return (
      <p className="text-gray-600 dark:text-neutral-300">
        Không thể tải dữ liệu. Vui lòng tải lại trang.
      </p>
    );
  }

  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const optionOf = (field, key) => editor.options[field].find((o) => o.key === key);

  // Points still needed to save the draft (0 = can save).
  const lockedPoints = Math.max(
    editor.can_customize ? 0 : editor.required_points,
    ...OPTION_FIELDS.map((field) => {
      const option = optionOf(field, draft[field]);
      return option && !option.unlocked ? option.required_points : 0;
    })
  );

  const save = async (theme) => {
    try {
      setSaving(true);
      await updateProfile(username, { profile_theme: theme });
      const next = theme || DEFAULT_THEME;
      setSaved(next);
      setDraft(next);
      setEditor((current) => ({ ...current, saved: theme }));
      message.success(theme ? "Đã lưu thay đổi." : "Đã khôi phục mặc định.");
    } catch (error) {
      console.error("Error saving profile theme:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (kind, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      message.error("Kích thước file không được vượt quá 10MB");
      return;
    }
    try {
      setUploading(kind);
      const formData = new FormData();
      if (kind === "avatar") {
        formData.append("avatar", file);
        await updateAvatar(username, formData);
      } else {
        formData.append("cover_photo", file);
        await updateCover(username, formData);
      }
      await load();
      message.success(kind === "avatar" ? "Đã đổi ảnh đại diện." : "Đã đổi ảnh bìa.");
    } catch (error) {
      console.error(`Error uploading ${kind}:`, error);
      message.error(error.response?.data?.message || "Tải ảnh lên thất bại.");
    } finally {
      setUploading(null);
    }
  };

  const colorSwatch = (label, key) => (
    <ColorPicker
      value={draft[key] || (key === "accent_color" ? DEFAULT_ACCENT : DEFAULT_PRIMARY)}
      disabledAlpha
      onChange={(color) => update({ [key]: pickHex(color) })}
    >
      <button
        type="button"
        aria-label={label}
        title={label}
        className={`h-12 flex-1 rounded-xl border ${
          draft[key]
            ? "border-gray-300 dark:border-neutral-500"
            : "border-dashed border-gray-400 dark:border-neutral-400 opacity-40"
        }`}
        style={{ backgroundColor: draft[key] || (key === "accent_color" ? DEFAULT_ACCENT : DEFAULT_PRIMARY) }}
      />
    </ColorPicker>
  );

  const profileName = profile.profile?.profile_name || profile.username;
  const avatarUrl = profile.profile?.profile_picture;
  const coverUrl = profile.profile?.cover_photo_url;

  const pickers = {
    avatar_frame: {
      title: "Khung ảnh đại diện",
      render: (key) => (
        <>
          <UserAvatar
            username={username}
            src={avatarUrl}
            theme={{ ...draft, avatar_frame: key }}
            className="w-14 h-14 my-1"
            imgClassName="bg-white"
          />
          <span className="text-xs dark:text-neutral-300">{OPTION_LABELS.avatar_frame[key]}</span>
        </>
      ),
    },
    profile_effect: {
      title: "Hiệu ứng hồ sơ",
      render: (key) => (
        <>
          <span className="relative isolate block h-16 w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 dark:from-neutral-600 dark:to-neutral-800">
            <ProfileEffect theme={{ ...draft, profile_effect: key }} replayKey={picker} />
          </span>
          <span className="text-xs dark:text-neutral-300">{OPTION_LABELS.profile_effect[key]}</span>
        </>
      ),
    },
    profile_frame: {
      title: "Khung hồ sơ",
      render: (key) => (
        <>
          <span className="relative isolate block h-16 w-full rounded-lg bg-gray-200 dark:bg-neutral-700">
            <ProfileFrame theme={{ ...draft, profile_frame: key }} className="rounded-lg" />
          </span>
          <span className="text-xs dark:text-neutral-300">{OPTION_LABELS.profile_frame[key]}</span>
        </>
      ),
    },
  };

  return (
    <div className={dirty ? "pb-24" : undefined}>
      {/* 3 columns from xl (editor | preview | milestones); below that the
          preview and milestones stack in the second column, unstuck so they
          never overlap while scrolling. */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_400px_minmax(0,1fr)] gap-6 items-start">
        {/* Left: editing slots */}
        <aside className="rounded-2xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4">
          <Section title="Ảnh đại diện & Khung">
            <div className="grid grid-cols-2 gap-2">
              <Slot
                label="Đổi ảnh đại diện"
                onClick={() => avatarInput.current?.click()}
                disabled={uploading === "avatar"}
              >
                <UserAvatar username={username} src={avatarUrl} className="w-16 h-16" imgClassName="bg-white" />
              </Slot>
              <Slot label="Chọn khung ảnh đại diện" onClick={() => setPicker("avatar_frame")}>
                {draft.avatar_frame === "none" ? (
                  <AddIcon />
                ) : (
                  <UserAvatar
                    username={username}
                    src={avatarUrl}
                    theme={draft}
                    className="w-14 h-14"
                    imgClassName="bg-white"
                  />
                )}
              </Slot>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
              {!editor.animated_avatar.unlocked && <Lock className="w-3 h-3" />}
              GIF động · {editor.animated_avatar.required_points} điểm
            </p>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                upload("avatar", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Section>

          <Section title="Ảnh bìa">
            <div className="grid grid-cols-2 gap-2">
              <ColorPicker
                value={draft.banner_color || "#9ca3af"}
                disabledAlpha
                onChange={(color) => update({ banner_color: pickHex(color) })}
              >
                <button
                  type="button"
                  aria-label="Chọn màu ảnh bìa"
                  title="Màu ảnh bìa"
                  className={`h-24 rounded-xl border ${
                    draft.banner_color
                      ? "border-transparent"
                      : "border-dashed border-gray-400 dark:border-neutral-400"
                  }`}
                  style={{ backgroundColor: draft.banner_color || undefined }}
                />
              </ColorPicker>
              <Slot
                label="Đổi ảnh bìa"
                onClick={() => coverInput.current?.click()}
                disabled={uploading === "cover"}
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="w-7 h-7 text-gray-500 dark:text-neutral-300" />
                )}
              </Slot>
            </div>
            {draft.banner_color && (
              <Button type="link" size="small" className="!px-0 mt-1" onClick={() => update({ banner_color: null })}>
                Bỏ màu ảnh bìa
              </Button>
            )}
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                upload("cover", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Section>

          <Section title="Hiệu ứng & Khung hồ sơ">
            <div className="grid grid-cols-2 gap-2">
              <Slot label="Chọn hiệu ứng hồ sơ" onClick={() => setPicker("profile_effect")}>
                {draft.profile_effect === "none" ? (
                  <AddIcon />
                ) : (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 dark:from-neutral-600 dark:to-neutral-800" />
                    <ProfileEffect theme={draft} replayKey={draft.profile_effect} />
                    <span className="relative text-xs font-medium text-white">
                      {OPTION_LABELS.profile_effect[draft.profile_effect]}
                    </span>
                  </>
                )}
              </Slot>
              <Slot label="Chọn khung hồ sơ" onClick={() => setPicker("profile_frame")}>
                {draft.profile_frame === "none" ? (
                  <AddIcon />
                ) : (
                  <>
                    <ProfileFrame theme={draft} className="rounded-xl" />
                    <span className="text-xs font-medium dark:text-neutral-200">
                      {OPTION_LABELS.profile_frame[draft.profile_frame]}
                    </span>
                  </>
                )}
              </Slot>
            </div>
          </Section>

          <Section title="Kiểu tên">
            <Slot label="Chọn kiểu tên" onClick={() => setPicker("name")} className="w-full h-16">
              <StyledName theme={draft} className="text-xl font-bold text-gray-900 dark:text-white truncate px-3">
                {profileName}
              </StyledName>
            </Slot>
          </Section>

          <Section title="Màu giao diện">
            <div className="flex gap-2">
              {colorSwatch("Màu chính", "primary_color")}
              {colorSwatch("Màu phụ", "accent_color")}
            </div>
            {(draft.primary_color || draft.accent_color) && (
              <Button
                type="link"
                size="small"
                className="!px-0 mt-1"
                onClick={() => update({ primary_color: null, accent_color: null })}
              >
                Bỏ màu giao diện
              </Button>
            )}
          </Section>

          {editor.saved && (
            <div className="py-4">
              <Button
                danger
                block
                disabled={saving}
                onClick={() =>
                  Modal.confirm({
                    title: "Khôi phục giao diện mặc định?",
                    okText: "Khôi phục",
                    cancelText: "Hủy",
                    okButtonProps: { danger: true },
                    onOk: () => save(null),
                  })
                }
              >
                Khôi phục mặc định
              </Button>
            </div>
          )}
        </aside>

        {/* Center: live profile card */}
        <div className="xl:sticky xl:top-20">
          <ProfilePreviewCard
            theme={draft}
            username={username}
            profileName={profileName}
            avatarUrl={avatarUrl}
            coverUrl={coverUrl}
            bio={profile.profile?.bio}
            joinedAt={profile.profile?.joined_at}
            points={editor.current_points}
            effectReplayKey={draft.profile_effect}
          />
        </div>

        {/* Right: points milestones */}
        <div className="lg:col-start-2 xl:col-start-auto">
          <PointsMilestones
            editor={editor}
            theme={draft}
            username={username}
            avatarUrl={avatarUrl}
            onTry={(field, key) => update({ [field]: key })}
          />
        </div>
      </div>

      {Object.entries(pickers).map(([field, config]) => (
        <OptionPickerModal
          key={field}
          open={picker === field}
          title={config.title}
          options={editor.options[field]}
          value={draft[field]}
          renderOption={config.render}
          onApply={(key) => update({ [field]: key })}
          onClose={() => setPicker(null)}
        />
      ))}
      <NameStyleModal
        open={picker === "name"}
        theme={draft}
        options={editor.options}
        profileName={profileName}
        onApply={update}
        onClose={() => setPicker(null)}
      />

      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
          <div
            role="status"
            className={`pointer-events-auto flex w-full max-w-[680px] flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5 shadow-lg ${
              shaking
                ? "profile-unsaved-shake bg-red-600 text-white"
                : "bg-neutral-900 text-white dark:bg-neutral-950"
            }`}
          >
            <span className="text-sm font-medium">
              {lockedPoints
                ? `Đang xem thử — cần ${lockedPoints} điểm để lưu`
                : "Đừng quên lưu thay đổi!"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraft(saved)}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium hover:underline disabled:opacity-60"
              >
                Đặt lại
              </button>
              <Button
                type="primary"
                loading={saving}
                disabled={lockedPoints > 0}
                onClick={() => save(draft)}
                className={lockedPoints ? "!bg-white/15 !text-white/60 !border-transparent" : undefined}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
