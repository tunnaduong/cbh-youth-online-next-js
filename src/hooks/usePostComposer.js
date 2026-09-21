"use client";

import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import { useAuthContext, useTopUsersContext } from "@/contexts/Support";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import { getForumData, createPost, updatePost, getPostDetail } from "@/app/Api";

/**
 * All the state, refs, effects and handlers behind the post composer
 * (create + edit) at /composer (src/app/composer/ComposerClient.js) - both
 * creating a post and editing one (`?edit=<id>`) go through this same page
 * and hook now.
 *
 * The description field itself is edited by the Tiptap-based
 * RichTextEditor (src/components/ui/RichTextEditor.js), which owns its own
 * undo/redo, IME composition and mention-suggestion handling internally -
 * this hook only stores the resulting Markdown string via
 * `handleDescriptionChange`.
 *
 * @param {object} opts
 * @param {boolean} [opts.isEditMode]
 * @param {{id: string|number}|null} [opts.postData] - Only `id` is needed;
 *   the rest of the post is fetched via getPostDetail() below.
 * @param {function|null} [opts.onSuccess]
 * @param {function} opts.onClose
 * @param {boolean} [opts.open] - Gates the forum-data fetch and the edit-mode
 *   preload fetch. Always true in practice since ComposerClient only mounts
 *   this hook once the page itself is "open" - kept as a parameter (rather
 *   than assumed) so the effect below stays an explicit, self-documenting
 *   guard instead of an unconditional fetch-on-mount.
 */
export default function usePostComposer({ isEditMode = false, postData = null, onSuccess = null, onClose, open = true }) {
  const { currentUser, refreshUser } = useAuthContext();
  const { fetchTopUsers } = useTopUsersContext();
  const { triggerRefresh } = usePostRefresh();

  const [selectedSubforum, setSelectedSubforum] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [selectedVisibility, setSelectedVisibility] = useState("public");
  const [forumData, setForumData] = useState({ main_categories: [] });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch forum data when the composer opens
  useEffect(() => {
    if (open && currentUser) {
      setLoading(true);
      getForumData()
        .then((response) => {
          setForumData(response.data || { main_categories: [] });
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching forum data:", error);
          setForumData({ main_categories: [] }); // Ensure we have a fallback structure
          message.error(
            "Không thể tải dữ liệu diễn đàn. Vui lòng thử lại sau."
          );
          setLoading(false);
        });
    }

    // Handle Edit Mode Data Pre-fill
    if (open && isEditMode && postData) {
      setLoading(true);
      getPostDetail(postData.id)
        .then((response) => {
          const fetchedPost = response.data.post;
          const fetchedDescription = fetchedPost.description || fetchedPost.content || "";
          setData({
            title: fetchedPost.title || "",
            description: fetchedDescription, // Prioritize description (raw content)
            subforum_id: fetchedPost.subforum_id || null,
            image_files: [],
            document_files: [],
            video_files: [],
            visibility: fetchedPost.visibility || 0,
            privacy: fetchedPost.privacy || "public",
            anonymous: fetchedPost.anonymous || false,
          });
          setExistingImages(fetchedPost.images || []);
          setExistingDocuments(fetchedPost.documents || []);
          setExistingVideos(fetchedPost.videos || []);
          setSelectedSubforum(fetchedPost.subforum_id || null);
          setSelectedVisibility(fetchedPost.privacy || "public");
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching post details:", error);
          message.error("Không thể tải chi tiết bài viết");
          setLoading(false);
          onClose();
        });
    } else if (open && !isEditMode) {
      reset(); // Reset if opening fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser, isEditMode, postData]);

  // Replace useForm with regular state management
  const [data, setData] = useState({
    title: "",
    description: "",
    subforum_id: null,
    image_files: [],
    document_files: [],
    video_files: [],
    visibility: 0, // 0: not hidden from feed, 1: hidden from feed
    privacy: "public", // public, followers, private
    anonymous: false, // false: normal post, true: anonymous post
  });
  const [existingImages, setExistingImages] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Description is edited by the Tiptap-based RichTextEditor (see
  // src/components/ui/RichTextEditor.js), which owns its own undo/redo,
  // IME composition handling, and mention suggestions internally - this
  // hook just stores the resulting Markdown string.
  const handleDescriptionChange = (markdown) => {
    setData((prev) => ({ ...prev, description: markdown }));
  };

  const reset = () => {
    setData({
      title: "",
      description: "",
      subforum_id: null,
      image_files: [],
      document_files: [],
      video_files: [],
      visibility: 0,
      privacy: "public",
      anonymous: false,
    });
    setExistingImages([]);
    setExistingDocuments([]);
    setExistingVideos([]);
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setDocumentFiles([]);
    setVideoFiles([]);
    setVideoPreviews([]);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", data);
    console.log("Auth user:", currentUser);
    console.log("Form validation - Title:", data.title);
    console.log("Form validation - Description:", data.description);
    console.log("Form validation - Subforum:", data.subforum_id);

    // Check if user is authenticated
    if (!currentUser) {
      message.error("Bạn cần đăng nhập để tạo bài viết");
      return;
    }

    // Validate required fields
    if (!data.title.trim()) {
      message.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    if (!data.description.trim()) {
      message.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    // Create FormData for API call
    setProcessing(true);

    try {
      const formData = new FormData();

      // Add basic post data
      formData.append("title", data.title);
      formData.append("description", data.description);
      if (data.subforum_id !== null && data.subforum_id !== undefined) {
        formData.append("subforum_id", data.subforum_id);
      }
      formData.append("visibility", data.visibility);
      formData.append("privacy", data.privacy);
      formData.append("anonymous", data.anonymous ? "1" : "0");

      if (isEditMode) {
        // Pass the list of IDs we want to KEEP
        formData.append("kept_image_ids", existingImages.map(img => img.id).join(','));
        formData.append("kept_document_ids", existingDocuments.map(doc => doc.id).join(','));
        formData.append("kept_video_ids", existingVideos.map(vid => vid.id).join(','));

        // For updates, often we need to specify method if backend requires it for FormData
        formData.append("_method", "PUT");
      }

      // Add image files
      imageFiles.forEach((file, index) => {
        formData.append(`image_files[${index}]`, file);
      });

      // Add document files
      documentFiles.forEach((file, index) => {
        formData.append(`document_files[${index}]`, file);
      });

      // Add video files
      videoFiles.forEach((file, index) => {
        formData.append(`video_files[${index}]`, file);
      });

      setUploadProgress(0);
      const config = {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      };

      // Make API call
      let response;
      if (isEditMode && postData && postData.id) {
        response = await updatePost(postData.id, formData, config);
      } else {
        response = await createPost(formData, config);
      }

      if (response.status === 201 || (isEditMode && response.status === 200)) {
        console.log(`Success: Post ${isEditMode ? 'updated' : 'created'}`, response.data);

        // AI moderation may hold the post for a human reviewer instead of
        // publishing it - say so rather than claiming it went up.
        const moderation = response.data?.moderation;
        if (moderation?.status === "pending") {
          message.warning(
            moderation.message ||
              "Bài viết của bạn đang chờ kiểm duyệt và sẽ được duyệt sớm.",
            6
          );
        } else {
          message.success(`Bài viết đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công!`);
        }
        reset();
        setSelectedSubforum(null);
        setImageFiles([]);
        setImagePreviews([]);
        setDocumentFiles([]);
        setVideoFiles([]);
        setVideoPreviews([]);
        setProcessing(false);

        // Trigger refresh of posts after successful creation
        if (onSuccess) {
          onSuccess();
        } else {
          triggerRefresh(); // This will trigger ForumDataProvider to refresh
        }

        // Refresh points and ranking
        refreshUser();
        if (fetchTopUsers) fetchTopUsers(true);

        onClose();
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} post:`, error);
      setProcessing(false);

      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        setErrors(errors);
        message.error("Vui lòng kiểm tra lại thông tin đã nhập");
      } else {
        message.error(`Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} bài viết. Vui lòng thử lại sau.`);
      }
    }
  };

  const handleImageFiles = (files) => {
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        message.error("Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        message.error("Kích thước file không được vượt quá 10MB");
        return;
      }
    }

    // Add new files to existing ones
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    setData((prev) => ({ ...prev, image_files: newFiles }));

    // Create previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(), // Unique ID for each preview
            file: file,
            preview: e.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentFiles = (files) => {
    if (files.length === 0) return;

    for (const file of files) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-office", // For older Office files
        "application/octet-stream", // Sometimes used for .doc files
      ];

      if (!validTypes.includes(file.type)) {
        message.error(
          `File type không được hỗ trợ: ${file.type}. Vui lòng chọn file PDF, DOCX hoặc TXT`
        );
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        message.error("Kích thước file không được vượt quá 25MB");
        return;
      }
    }

    // Add new files to existing ones
    const newFiles = [...documentFiles, ...files];
    setDocumentFiles(newFiles);
    setData((prev) => ({ ...prev, document_files: newFiles }));
  };

  const handleVideoFiles = (files) => {
    if (files.length === 0) return;

    const validTypes = [
      "video/mp4",
      "video/quicktime", // .mov
      "video/x-msvideo", // .avi
      "video/webm",
      "video/x-matroska", // .mkv
    ];

    for (const file of files) {
      if (!validTypes.includes(file.type) && !file.type.startsWith("video/")) {
        message.error("Vui lòng chọn file video hợp lệ (mp4, mov, avi, webm, mkv)");
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        message.error("Kích thước video không được vượt quá 100MB");
        return;
      }
    }

    const newFiles = [...videoFiles, ...files];
    setVideoFiles(newFiles);
    setData((prev) => ({ ...prev, video_files: newFiles }));

    files.forEach((file) => {
      setVideoPreviews((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          file: file,
          preview: URL.createObjectURL(file),
        },
      ]);
    });
  };

  const handleImageChange = (e) => {
    handleImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDocumentChange = (e) => {
    handleDocumentFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleVideoChange = (e) => {
    handleVideoFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // A drag originating from another tab/page (e.g. dragging an <img> from a website)
  // never exposes "Files" — it shows up as a URL/HTML payload instead.
  const isDraggableImageSource = (dataTransfer) =>
    dataTransfer.types.includes("Files") ||
    dataTransfer.types.includes("text/uri-list") ||
    dataTransfer.types.includes("text/html");

  const extractImageUrlFromDataTransfer = (dataTransfer) => {
    const uriList = dataTransfer.getData("text/uri-list");
    if (uriList) {
      const url = uriList.split("\n").find((line) => line && !line.startsWith("#"));
      if (url) return url.trim();
    }

    const html = dataTransfer.getData("text/html");
    if (html) {
      const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match) return match[1];
    }

    const plainText = dataTransfer.getData("text/plain");
    if (plainText && /^https?:\/\//i.test(plainText.trim())) {
      return plainText.trim();
    }

    return null;
  };

  const handleRemoteImageDrop = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Fetch failed");

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        message.error("Đường dẫn kéo thả không phải là ảnh hợp lệ");
        return;
      }

      const extension = blob.type.split("/")[1] || "png";
      const fileName = `image-${Date.now()}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });
      handleImageFiles([file]);
    } catch (error) {
      console.error("Error fetching dropped image URL:", error);
      message.error(
        "Không thể tải ảnh từ đường dẫn này (có thể do giới hạn CORS của trang nguồn)"
      );
    }
  };

  const handleFilesDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFiles(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const imageFilesToAdd = files.filter((file) => file.type.startsWith("image/"));
      const videoFilesToAdd = files.filter((file) => file.type.startsWith("video/"));
      const documentFilesToAdd = files.filter(
        (file) => !file.type.startsWith("image/") && !file.type.startsWith("video/")
      );

      if (imageFilesToAdd.length > 0) handleImageFiles(imageFilesToAdd);
      if (videoFilesToAdd.length > 0) handleVideoFiles(videoFilesToAdd);
      if (documentFilesToAdd.length > 0) handleDocumentFiles(documentFilesToAdd);
      return;
    }

    // No local files were dropped — this is likely an image dragged from another tab.
    const imageUrl = extractImageUrlFromDataTransfer(e.dataTransfer);
    if (imageUrl) {
      handleRemoteImageDrop(imageUrl);
    }
  };

  const handleFilesDragEnter = (e) => {
    e.preventDefault();
    if (!isDraggableImageSource(e.dataTransfer)) return;

    dragCounterRef.current += 1;
    setIsDraggingFiles(true);
  };

  const handleFilesDragLeave = (e) => {
    e.preventDefault();
    if (!isDraggableImageSource(e.dataTransfer)) return;

    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFiles(false);
  };

  // removeImage/removeDocument/removeVideo only drop *new* (not-yet-uploaded)
  // files - existing (already-on-server) attachments are removed by filtering
  // setExistingImages/Documents/Videos directly, which the composer UI calls
  // inline.
  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setData((prev) => ({ ...prev, image_files: newFiles }));
  };

  const removeDocument = (index) => {
    const newFiles = documentFiles.filter((_, i) => i !== index);
    setDocumentFiles(newFiles);
    setData((prev) => ({ ...prev, document_files: newFiles }));
  };

  const removeVideo = (index) => {
    const removed = videoPreviews[index];
    if (removed) URL.revokeObjectURL(removed.preview);

    const newFiles = videoFiles.filter((_, i) => i !== index);
    const newPreviews = videoPreviews.filter((_, i) => i !== index);

    setVideoFiles(newFiles);
    setVideoPreviews(newPreviews);
    setData((prev) => ({ ...prev, video_files: newFiles }));
  };

  const handleSubforumChange = (value) => {
    setSelectedSubforum(value);
    setData((prev) => ({ ...prev, subforum_id: value }));
  };

  const handleVisibilityChange = (value) => {
    setSelectedVisibility(value);
    // Always set visibility to 0 (not hidden from feed)
    setData((prev) => ({ ...prev, visibility: 0, privacy: value }));
  };

  return {
    // auth / display
    currentUser,

    // form data
    data,
    setData,
    errors,
    processing,

    // subforum / visibility
    selectedSubforum,
    handleSubforumChange,
    selectedVisibility,
    handleVisibilityChange,
    forumData,
    loading,

    // description editor
    handleDescriptionChange,

    // images
    imageFiles,
    imagePreviews,
    existingImages,
    setExistingImages,
    imageInputRef,
    handleImageChange,
    removeImage,

    // documents
    documentFiles,
    existingDocuments,
    setExistingDocuments,
    documentInputRef,
    handleDocumentChange,
    removeDocument,

    // videos
    videoFiles,
    videoPreviews,
    existingVideos,
    setExistingVideos,
    videoInputRef,
    handleVideoChange,
    removeVideo,

    // drag & drop
    isDraggingFiles,
    isDraggableImageSource,
    handleFilesDrop,
    handleFilesDragEnter,
    handleFilesDragLeave,

    // submit
    uploadProgress,
    handleSubmit,
  };
}
