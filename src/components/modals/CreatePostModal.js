"use client";

import React from "react";
import { Modal } from "antd";
import { useRouter } from "@bprogress/next/app";
import { useRichTextEditor } from "@/components/ui/RichTextEditor";
import ComposerForm from "@/components/forum/ComposerForm";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import usePostComposer from "@/hooks/usePostComposer";

// Same key ComposerClient.js (the /composer page) reads on mount.
const DRAFT_HANDOFF_KEY = "composer_modal_handoff";

/**
 * The quick "create/edit post" modal opened from the navbar, the home page
 * hero, RightSidebar's CTA, and PostItem's edit action. Shares its actual
 * form UI with the full /composer page via ComposerForm.js - the "Nâng cao"
 * button lets someone bail out of the modal into that full page without
 * losing what they've typed (see the sessionStorage handoff below).
 */
export default function CreatePostModal({ open, onClose, isEditMode = false, postId = null }) {
  const router = useRouter();
  const { triggerRefresh } = usePostRefresh();

  const composer = usePostComposer({
    open,
    isEditMode,
    postData: isEditMode && postId ? { id: postId } : null,
    onSuccess: () => {
      triggerRefresh();
      router.refresh();
    },
    onClose,
  });

  const descriptionEditor = useRichTextEditor({
    value: composer.data.description,
    onChange: composer.handleDescriptionChange,
    placeholder: "Nội dung bài viết",
  });

  const handleOpenAdvanced = () => {
    try {
      sessionStorage.setItem(
        DRAFT_HANDOFF_KEY,
        JSON.stringify({
          title: composer.data.title,
          description: composer.data.description,
          subforum_id: composer.data.subforum_id,
          privacy: composer.data.privacy,
          anonymous: composer.data.anonymous,
        })
      );
    } catch {
      // sessionStorage unavailable (private mode etc.) - the advanced
      // editor just opens with a clean draft instead of the current one.
    }
    onClose();
    router.push(isEditMode && postId ? `/composer?edit=${postId}` : "/composer");
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnHidden
      title={isEditMode ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
    >
      <ComposerForm
        data={composer.data}
        setData={composer.setData}
        errors={composer.errors}
        processing={composer.processing}
        selectedSubforum={composer.selectedSubforum}
        handleSubforumChange={composer.handleSubforumChange}
        selectedVisibility={composer.selectedVisibility}
        handleVisibilityChange={composer.handleVisibilityChange}
        forumData={composer.forumData}
        loading={composer.loading}
        descriptionEditor={descriptionEditor}
        imageFiles={composer.imageFiles}
        imagePreviews={composer.imagePreviews}
        existingImages={composer.existingImages}
        setExistingImages={composer.setExistingImages}
        imageInputRef={composer.imageInputRef}
        handleImageChange={composer.handleImageChange}
        removeImage={composer.removeImage}
        documentFiles={composer.documentFiles}
        existingDocuments={composer.existingDocuments}
        setExistingDocuments={composer.setExistingDocuments}
        documentInputRef={composer.documentInputRef}
        handleDocumentChange={composer.handleDocumentChange}
        removeDocument={composer.removeDocument}
        videoFiles={composer.videoFiles}
        videoPreviews={composer.videoPreviews}
        existingVideos={composer.existingVideos}
        setExistingVideos={composer.setExistingVideos}
        videoInputRef={composer.videoInputRef}
        handleVideoChange={composer.handleVideoChange}
        removeVideo={composer.removeVideo}
        isDraggingFiles={composer.isDraggingFiles}
        isDraggableImageSource={composer.isDraggableImageSource}
        handleFilesDrop={composer.handleFilesDrop}
        handleFilesDragEnter={composer.handleFilesDragEnter}
        handleFilesDragLeave={composer.handleFilesDragLeave}
        uploadProgress={composer.uploadProgress}
        handleSubmit={composer.handleSubmit}
        isEditMode={isEditMode}
        onOpenAdvanced={handleOpenAdvanced}
      />
    </Modal>
  );
}
