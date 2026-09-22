"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "@bprogress/next/app";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import { useRichTextEditor } from "@/components/ui/RichTextEditor";
import ComposerForm from "@/components/forum/ComposerForm";
import { useAuthContext } from "@/contexts/Support";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import usePostComposer from "@/hooks/usePostComposer";

// Written by CreatePostModal.js's "Nâng cao" button right before it
// navigates here, so switching from the quick modal to the full editor
// doesn't lose whatever the user already typed. Not a persisted draft
// feature - read once and discarded.
const DRAFT_HANDOFF_KEY = "composer_modal_handoff";

/**
 * The post composer at /composer (src/app/composer/page.js) - a plain page
 * inside the site's normal chrome (navbar + left sidebar, via HomeLayout),
 * not a modal/overlay. Modeled after Reddit's post composer: a "select
 * community" dropdown up top, title, a body editor with its formatting
 * toolbar directly underneath, and Post on the bottom right. Handles both
 * creating a post and editing one (`?edit=<id>`).
 *
 * The everyday "create post" entry points (navbar, sidebar, home) open the
 * quick CreatePostModal instead; this page is reached via its "Nâng cao"
 * button, or directly via ?edit=<id> from PostItem's edit action.
 */
export default function ComposerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const { loggedIn, currentUser, authLoading } = useAuthContext();
  const { triggerRefresh } = usePostRefresh();
  const handoffAppliedRef = useRef(false);

  // Mirrors useCreatePostGate.js's checks for anyone who lands here directly
  // via the URL instead of through a gated trigger (navbar/sidebar/home hero).
  useEffect(() => {
    if (authLoading) return;
    if (!loggedIn) {
      message.error("Bạn cần đăng nhập để tạo cuộc thảo luận");
      router.replace("/login?continue=" + encodeURIComponent("/composer"));
      return;
    }
    if (!currentUser?.email_verified_at) {
      message.error("Bạn cần xác minh email để tạo cuộc thảo luận");
      router.replace("/");
    }
  }, [authLoading, loggedIn, currentUser, router]);

  const {
    data,
    setData,
    errors,
    processing,
    selectedSubforum,
    handleSubforumChange,
    selectedVisibility,
    handleVisibilityChange,
    forumData,
    loading,
    handleDescriptionChange,
    imageFiles,
    imagePreviews,
    existingImages,
    setExistingImages,
    imageInputRef,
    handleImageChange,
    removeImage,
    documentFiles,
    existingDocuments,
    setExistingDocuments,
    documentInputRef,
    handleDocumentChange,
    removeDocument,
    videoFiles,
    videoPreviews,
    existingVideos,
    setExistingVideos,
    videoInputRef,
    handleVideoChange,
    removeVideo,
    isDraggingFiles,
    isDraggableImageSource,
    handleFilesDrop,
    handleFilesDragEnter,
    handleFilesDragLeave,
    uploadProgress,
    handleSubmit,
  } = usePostComposer({
    open: true,
    isEditMode,
    postData: isEditMode ? { id: editId } : null,
    onSuccess: () => {
      triggerRefresh();
      router.refresh();
      router.push("/");
    },
    onClose: () => router.push("/"),
  });

  // Pick up a draft handed off from the quick CreatePostModal (only makes
  // sense for a fresh post - editing already loads its own data from the API).
  useEffect(() => {
    if (isEditMode || handoffAppliedRef.current) return;
    let raw;
    try {
      raw = sessionStorage.getItem(DRAFT_HANDOFF_KEY);
      sessionStorage.removeItem(DRAFT_HANDOFF_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    handoffAppliedRef.current = true;
    try {
      const draft = JSON.parse(raw);
      setData((prev) => ({
        ...prev,
        title: draft.title || "",
        description: draft.description || "",
        subforum_id: draft.subforum_id ?? prev.subforum_id,
        privacy: draft.privacy || prev.privacy,
        anonymous: Boolean(draft.anonymous),
      }));
      if (draft.subforum_id) handleSubforumChange(draft.subforum_id);
      if (draft.privacy) handleVisibilityChange(draft.privacy);
    } catch {
      // Malformed/foreign sessionStorage value - ignore, start fresh.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const descriptionEditor = useRichTextEditor({
    value: data.description,
    onChange: handleDescriptionChange,
    placeholder: "Nội dung bài viết",
  });

  if (authLoading || !loggedIn || !currentUser?.email_verified_at) {
    // The redirect effect above is about to kick in - render nothing
    // meaningful in the meantime instead of flashing the composer UI.
    return null;
  }

  return (
    <div className="mx-auto w-full px-3 pb-10 pt-5 md:max-w-[775px] md:px-1">
      <h1 className="mb-4 text-xl font-bold">
        {isEditMode ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
      </h1>
      <ComposerForm
        data={data}
        setData={setData}
        errors={errors}
        processing={processing}
        selectedSubforum={selectedSubforum}
        handleSubforumChange={handleSubforumChange}
        selectedVisibility={selectedVisibility}
        handleVisibilityChange={handleVisibilityChange}
        forumData={forumData}
        loading={loading}
        descriptionEditor={descriptionEditor}
        imageFiles={imageFiles}
        imagePreviews={imagePreviews}
        existingImages={existingImages}
        setExistingImages={setExistingImages}
        imageInputRef={imageInputRef}
        handleImageChange={handleImageChange}
        removeImage={removeImage}
        documentFiles={documentFiles}
        existingDocuments={existingDocuments}
        setExistingDocuments={setExistingDocuments}
        documentInputRef={documentInputRef}
        handleDocumentChange={handleDocumentChange}
        removeDocument={removeDocument}
        videoFiles={videoFiles}
        videoPreviews={videoPreviews}
        existingVideos={existingVideos}
        setExistingVideos={setExistingVideos}
        videoInputRef={videoInputRef}
        handleVideoChange={handleVideoChange}
        removeVideo={removeVideo}
        isDraggingFiles={isDraggingFiles}
        isDraggableImageSource={isDraggableImageSource}
        handleFilesDrop={handleFilesDrop}
        handleFilesDragEnter={handleFilesDragEnter}
        handleFilesDragLeave={handleFilesDragLeave}
        uploadProgress={uploadProgress}
        handleSubmit={handleSubmit}
        isEditMode={isEditMode}
      />
    </div>
  );
}
