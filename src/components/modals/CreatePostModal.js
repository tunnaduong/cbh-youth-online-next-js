"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, Button, Select, message, Switch, Dropdown } from "antd";
import CustomInput from "../ui/input";
import CustomColorButton from "../ui/CustomColorButton";
// // import { usePage, useForm } from "@inertiajs/react"; // TODO: Replace with Next.js equivalent // TODO: Replace with Next.js equivalent
import VerifiedBadge from "../ui/Badges";
import MarkdownToolbar from "../ui/MarkdownToolbar";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import { IoEarth, IoCaretDown } from "react-icons/io5";
import { FaEye, FaMarkdown, FaEdit } from "react-icons/fa";
import { FaFileLines } from "react-icons/fa6";
import { useAuthContext } from "@/contexts/Support";
import { usePostRefresh } from "@/contexts/PostRefreshContext";
import { getForumData, createPost } from "@/app/Api";
import { useForumData } from "@/contexts/ForumDataContext";

const CreatePostModal = ({ open, onClose }) => {
  const { currentUser } = useAuthContext();
  const { triggerRefresh } = usePostRefresh();
  const { fetchHomeData } = useForumData();

  const [selectedSubforum, setSelectedSubforum] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [selectedVisibility, setSelectedVisibility] = useState("public");
  const [forumData, setForumData] = useState({ main_categories: [] });
  const [loading, setLoading] = useState(false);

  // Fetch forum data when modal opens
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
  }, [open, currentUser]);

  // Replace useForm with regular state management
  const [data, setData] = useState({
    title: "",
    description: "",
    subforum_id: null,
    image_files: [],
    document_files: [],
    visibility: 0, // 0: not hidden from feed, 1: hidden from feed
    privacy: "public", // public, followers, private
    anonymous: false, // false: normal post, true: anonymous post
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef(null);

  // Handle auto-continuation for lists
  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter") {
      const textarea =
        textareaRef.current?.resizableTextArea?.textArea || textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      // Get the current line
      const lines = text.substring(0, start).split("\n");
      const currentLine = lines[lines.length - 1];

      // Check if current line is a bullet list
      const bulletMatch = currentLine.match(/^(\s*)(-\s)/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const newLine = `\n${indent}- `;
        const newText =
          text.substring(0, start) + newLine + text.substring(end);
        const newCursorPos = start + newLine.length;

        textarea.value = newText;
        setData((prev) => ({ ...prev, description: newText }));

        setTimeout(() => {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
        return;
      }

      // Check if current line is a numbered list
      const numberedMatch = currentLine.match(/^(\s*)(\d+\.\s)/);
      if (numberedMatch) {
        e.preventDefault();
        const indent = numberedMatch[1];
        const currentNumber = parseInt(numberedMatch[2]);
        const newLine = `\n${indent}${currentNumber + 1}. `;
        const newText =
          text.substring(0, start) + newLine + text.substring(end);
        const newCursorPos = start + newLine.length;

        textarea.value = newText;
        setData((prev) => ({ ...prev, description: newText }));

        setTimeout(() => {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
        return;
      }
    }
  };

  const reset = () => {
    setData({
      title: "",
      description: "",
      subforum_id: null,
      image_files: [],
      document_files: [],
      visibility: 0,
      privacy: "public",
      anonymous: false,
    });
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setDocumentFiles([]);
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

      // Add image files
      imageFiles.forEach((file, index) => {
        formData.append(`image_files[${index}]`, file);
      });

      // Add document files
      documentFiles.forEach((file, index) => {
        formData.append(`document_files[${index}]`, file);
      });

      // Make API call
      const response = await createPost(formData);

      if (response.status === 201) {
        console.log("Success: Post created", response.data);
        message.success("Bài viết đã được tạo thành công!");
        reset();
        setSelectedSubforum(null);
        setImageFiles([]);
        setImagePreviews([]);
        setDocumentFiles([]);
        setProcessing(false);

        // Trigger refresh of posts after successful creation
        triggerRefresh(); // This will trigger ForumDataProvider to refresh
        onClose();
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setProcessing(false);

      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        setErrors(errors);
        message.error("Vui lòng kiểm tra lại thông tin đã nhập");
      } else {
        message.error("Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại sau.");
      }
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validate all files
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

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validate all files
    for (const file of files) {
      console.log("File type:", file.type, "File name:", file.name);

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

  const handleSubforumChange = (value) => {
    setSelectedSubforum(value);
    setData((prev) => ({ ...prev, subforum_id: value }));
  };

  const handleVisibilityChange = (value) => {
    setSelectedVisibility(value);
    // Always set visibility to 0 (not hidden from feed)
    setData((prev) => ({ ...prev, visibility: 0, privacy: value }));
  };

  const visibilityMenuItems = [
    {
      key: "public",
      label: (
        <div className="flex items-center gap-2">
          <IoEarth className="text-base" />
          <span>Công khai</span>
        </div>
      ),
    },
    {
      key: "followers",
      disabled: data.anonymous,
      label: (
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m22 21-2-2" />
            <path d="m16 16 2 2" />
          </svg>
          <span>Chỉ người theo dõi</span>
        </div>
      ),
    },
    {
      key: "private",
      label: (
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <circle cx="12" cy="16" r="1" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Chỉ mình tôi</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        closable={{ "aria-label": "Custom Close Button" }}
        open={open}
        onOk={onClose}
        onCancel={onClose}
        footer={null}
        style={{ top: 40 }}
        className="custom-modal"
      >
        <div>
          <div className="flex flex-row justify-center items-center pb-[34px] relative">
            <h1 className="text-lg font-bold text-center absolute -top-1.5">
              Tạo cuộc thảo luận
            </h1>
          </div>
          <hr className="absolute right-0 left-0 w-full" />
          <div className="flex flex-row items-center py-3">
            {data.anonymous ? (
              <div className="w-11 h-11 rounded-full bg-[#e9f1e9] dark:bg-[#1d281b] flex items-center justify-center text-[27px] font-semibold text-white">
                ?
              </div>
            ) : (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser?.username}/avatar`}
                alt={currentUser?.username}
                className="border w-11 h-11 rounded-full"
              />
            )}
            <div className="ml-2">
              <span className="text-base font-semibold mb-0.5 flex items-center min-w-0">
                {data.anonymous ? (
                  "Người dùng ẩn danh"
                ) : (
                  <span className="inline">
                    <span className="line-clamp-1 inline">
                      {currentUser?.profile_name}
                    </span>
                    {currentUser?.verified && (
                      <VerifiedBadge className="ml-1 mb-0.5" />
                    )}
                  </span>
                )}
              </span>
              <Dropdown
                menu={{
                  items: visibilityMenuItems,
                  onClick: ({ key }) => handleVisibilityChange(key),
                }}
                trigger={["click"]}
                placement="bottomLeft"
              >
                <button className="flex items-center bg-gray-200 dark:bg-neutral-500 gap-x-0.5 rounded-md px-1.5 py-0.5 cursor-pointer w-max hover:bg-gray-300 dark:hover:bg-neutral-400 transition-colors">
                  {selectedVisibility === "public" ? (
                    <IoEarth className="text-base mt-[1px]" />
                  ) : selectedVisibility === "followers" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mt-[1px]"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="m22 21-2-2" />
                      <path d="m16 16 2 2" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 mt-[1px]"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <circle cx="12" cy="16" r="1" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                  <span className="text-sm font-semibold">
                    {selectedVisibility === "public"
                      ? "Công khai"
                      : selectedVisibility === "followers"
                      ? "Chỉ người theo dõi"
                      : "Chỉ mình tôi"}
                  </span>
                  <IoCaretDown className="text-[9px] mt-[1px]" />
                </button>
              </Dropdown>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <CustomInput
              placeholder="Tiêu đề bài viết"
              value={data.title}
              onChange={(e) =>
                setData((prev) => ({ ...prev, title: e.target.value }))
              }
              error={errors.title}
            />
            <div className="rounded-md border shadow-sm pb-2 bg-gray-100 dark:bg-neutral-600 dark:!border-neutral-500">
              <MarkdownToolbar
                textareaRef={textareaRef}
                onTextChange={(value) =>
                  setData((prev) => ({ ...prev, description: value }))
                }
                isPreviewMode={isPreviewMode}
              />
              <div className="relative -mx-[1px] -mt-[1px]">
                {isPreviewMode ? (
                  <div className="min-h-[120px] p-3 bg-white dark:bg-[#3c3c3c] rounded-md border dark:!border-neutral-500">
                    <MarkdownRenderer content={data.description} />
                  </div>
                ) : (
                  <Input.TextArea
                    ref={textareaRef}
                    id="postDescription"
                    name="description"
                    className="!bg-white dark:!bg-[#3c3c3c]"
                    placeholder="Nội dung bài viết"
                    spellCheck="false"
                    data-ms-editor="true"
                    value={data.description}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    onKeyDown={handleTextareaKeyDown}
                    rows={5}
                  />
                )}
                {errors.description && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </div>
                )}
              </div>
              <div className="px-3 flex items-center gap-x-2 mt-3 text-gray-500 dark:text-neutral-400">
                <a
                  href="/guide/markdown"
                  className="-mt-1.5 text-xs font-bold border-right pr-2 flex items-center"
                  target="_blank"
                >
                  <FaMarkdown className="mr-1" />
                  Hỗ trợ Markdown
                </a>
                <a
                  href="/policy/forum-rules"
                  className="-mt-1.5 text-xs font-bold flex items-center border-right pr-2"
                  target="_blank"
                >
                  <FaFileLines className="mr-1" />
                  Quy tắc
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="-mt-1.5 text-xs font-bold flex items-center"
                >
                  {isPreviewMode ? (
                    <>
                      <FaEdit className="mr-1" />
                      Chỉnh sửa
                    </>
                  ) : (
                    <>
                      <FaEye className="mr-1" />
                      Xem trước
                    </>
                  )}
                </button>
              </div>
            </div>
            <Select
              value={selectedSubforum}
              onChange={handleSubforumChange}
              style={{ width: "100%" }}
              loading={loading}
              options={
                forumData?.main_categories?.map((category) => ({
                  label: <span>{category.name}</span>,
                  title: category.name,
                  options:
                    category.sub_forums?.map((subforum) => ({
                      label: <span>{subforum.name}</span>,
                      value: subforum.id,
                    })) || [],
                })) || []
              }
              placeholder={loading ? "Đang tải..." : "Chọn chuyên mục phù hợp"}
              className="shadow-sm"
            />
            {errors.subforum_id && (
              <div className="text-red-500 text-sm">{errors.subforum_id}</div>
            )}

            {/* Anonymous Posting Switcher */}
            <div className="flex flex-col space-y-2 shadow-sm">
              <div className="flex items-center justify-between p-3 rounded-lg border dark:!border-neutral-500 bg-gray-50 dark:bg-neutral-700">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Đăng ẩn danh
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Người kiểm duyệt vẫn sẽ thấy thông tin của bạn
                  </span>
                </div>
                <Switch
                  checked={data.anonymous}
                  onChange={(checked) =>
                    setData((prev) => ({ ...prev, anonymous: checked }))
                  }
                  size="default"
                />
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={preview.id} className="relative">
                    <img
                      src={preview.preview}
                      alt={`Preview ${index + 1}`}
                      className="border rounded-md dark:!border-neutral-500 w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {documentFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {documentFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-neutral-600 rounded-md"
                  >
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2 text-blue-500"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center rounded-lg border dark:!border-neutral-500 bg-gray-50 dark:bg-neutral-700 p-3 shadow-sm">
                <p className="text-sm font-medium flex-1">
                  Thêm vào bài viết của bạn
                  {(imageFiles.length > 0 || documentFiles.length > 0) && (
                    <span className="ml-2 text-primary-500 font-semibold">
                      ({imageFiles.length + documentFiles.length} đã chọn)
                    </span>
                  )}
                </p>
                <input
                  id="fileInput"
                  accept="image/*"
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <input
                  id="documentInput"
                  accept=".pdf,.doc,.docx,.txt"
                  type="file"
                  multiple
                  onChange={handleDocumentChange}
                  style={{ display: "none" }}
                />
                <div className="flex gap-1">
                  <Button
                    size="small"
                    className="h-8 px-2 rounded-full border-0"
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-image h-4 w-4 text-emerald-500"
                    >
                      <rect
                        width={18}
                        height={18}
                        x={3}
                        y={3}
                        rx={2}
                        ry={2}
                      ></rect>
                      <circle cx={9} cy={9} r={2} />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </Button>
                  <Button
                    size="small"
                    className="h-8 px-2 rounded-full border-0"
                    onClick={() =>
                      document.getElementById("documentInput").click()
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-blue-500"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            <CustomColorButton
              block
              bgColor="#318527"
              className="text-base font-semibold py-[19px] mb-1.5"
              type="submit"
              disabled={processing}
              onClick={handleSubmit}
            >
              {processing ? "Đang đăng..." : "Đăng"}
            </CustomColorButton>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default CreatePostModal;
