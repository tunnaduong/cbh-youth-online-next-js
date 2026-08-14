"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { Input, Select, Tabs, Upload, Button, Dropdown, message, Alert } from "antd";
import {
  PencilLine,
  Sparkles,
  Loader2,
  Bold as BoldIcon,
  Underline as UnderlineIcon,
  Palette,
  UploadCloud,
  CheckCircle2,
  Copy,
  Play,
  FileText,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import HomeLayout from "@/layouts/HomeLayout";
import { createCustomQuiz } from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const { TextArea } = Input;

const DIFFICULTIES = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const TITLE_MAX = 150;
const FILE_MAX_BYTES = 10 * 1024 * 1024; // 10MB, must match backend CustomQuizController
const ALLOWED_EXTENSIONS = [".docx", ".txt", ".pdf"];

const COLOR_SWATCHES = [
  "#e11d48", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#0ea5e9", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#0f172a", // near-black (still distinct enough vs pure default text color)
];

const EXAMPLE_TEXT = `Câu 1: Thủ đô của Việt Nam là gì?
A. Hồ Chí Minh
B. Hà Nội   (đánh dấu đáp án đúng bằng cách in đậm, gạch chân hoặc tô màu chữ)
C. Đà Nẵng
D. Huế
Giải thích: Hà Nội là thủ đô của Việt Nam từ năm 1010.`;

function isInAppWebView() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("app") === "true"
  );
}

function EditorToolbar({ editor }) {
  if (!editor) return null;

  const colorMenuItems = COLOR_SWATCHES.map((color) => ({
    key: color,
    label: (
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-4 h-4 rounded-full border border-gray-200"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs">{color}</span>
      </div>
    ),
  }));

  return (
    <div className="flex items-center gap-1 border border-gray-200 dark:border-neutral-600 border-b-0 rounded-t-lg px-2 py-1.5 bg-gray-50 dark:bg-neutral-700">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("bold")
            ? "bg-[#319527] text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600"
        }`}
        title="In đậm"
      >
        <BoldIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("underline")
            ? "bg-[#319527] text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600"
        }`}
        title="Gạch chân"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <Dropdown
        menu={{
          items: colorMenuItems,
          onClick: ({ key }) => editor.chain().focus().setColor(key).run(),
        }}
        trigger={["click"]}
      >
        <button
          type="button"
          className="p-1.5 rounded transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600"
          title="Màu chữ"
        >
          <Palette className="w-4 h-4" />
        </button>
      </Dropdown>
      {editor.isActive("textStyle") && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
        >
          Bỏ màu
        </button>
      )}
    </div>
  );
}

export default function CustomQuizClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode] = useState("type"); // "type" | "upload"
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null); // { quiz_set_id, topic, difficulty, question_count }
  const [shareLink, setShareLink] = useState("");

  const editor = useEditor({
    extensions: [StarterKit, Underline, TextStyle, Color],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!authLoading && !loggedIn) {
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
    }
  }, [authLoading, loggedIn, router]);

  useEffect(() => {
    if (result?.quiz_set_id && typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/explore/quiz?shared=${result.quiz_set_id}`);
    }
  }, [result]);

  const sidebarItems = EXPLORE_FEATURES.map((feature) => ({
    key: feature.key,
    href: feature.href,
    label: feature.title,
    Icon: feature.sidebarIcon,
    isExternal: false,
    onClick:
      feature.href === "#"
        ? (e) => {
            e.preventDefault();
            message.info("Chức năng đang phát triển");
          }
        : undefined,
  }));

  const validateFile = useCallback((candidate) => {
    if (!candidate) return "";
    const name = candidate.name || "";
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Chỉ chấp nhận tệp ${ALLOWED_EXTENSIONS.join(", ")}.`;
    }
    if (candidate.size > FILE_MAX_BYTES) {
      return "Tệp quá lớn. Kích thước tối đa là 10MB.";
    }
    return "";
  }, []);

  const beforeUpload = (candidate) => {
    const err = validateFile(candidate);
    if (err) {
      setFileError(err);
      setFile(null);
      message.error(err);
      return Upload.LIST_IGNORE;
    }
    setFileError("");
    setFile(candidate);
    return false; // prevent antd's own auto-upload - we submit manually
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError("");
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      message.success("Đã sao chép liên kết vào bộ nhớ tạm");
    } catch {
      message.error("Không thể sao chép liên kết");
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    const contentHtml = editor?.getHTML() || "";
    const hasContent = mode === "type" && editor && !editor.isEmpty;
    const hasFile = mode === "upload" && !!file;

    if (!hasContent && !hasFile) {
      const msg =
        mode === "type"
          ? "Vui lòng nhập nội dung câu hỏi."
          : "Vui lòng chọn một tệp để tải lên.";
      setErrorMessage(msg);
      return;
    }
    if (mode === "upload" && fileError) {
      setErrorMessage(fileError);
      return;
    }

    const formData = new FormData();
    if (title.trim()) formData.append("title", title.trim());
    formData.append("difficulty", difficulty);
    if (mode === "type") {
      formData.append("content_html", contentHtml);
    } else {
      formData.append("file", file);
    }

    setSubmitting(true);
    try {
      const res = await createCustomQuiz(formData);
      const data = res?.data || res;
      setResult(data);
    } catch (error) {
      if (!isInAppWebView()) {
        const backendMessage = error?.response?.data?.message;
        setErrorMessage(
          error?.response?.status === 422 && backendMessage
            ? backendMessage
            : "Không thể tạo bộ đề lúc này, vui lòng thử lại."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setResult(null);
    setShareLink("");
    setErrorMessage("");
    setTitle("");
    setDifficulty("medium");
    setMode("type");
    setFile(null);
    setFileError("");
    editor?.commands.clearContent();
  };

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="quiz"
      sidebarItems={sidebarItems}
      sidebarType="all"
      sidebarWidth="306px"
      showRightSidebar={false}
    >
      <div className="max-w-[760px] mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PencilLine className="w-6 h-6 text-[#319527]" />
            Tạo bộ đề tùy chỉnh
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Tự soạn bộ câu hỏi trắc nghiệm của riêng bạn để chia sẻ và chơi cùng bạn bè.
        </p>

        {result ? (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#319527] mx-auto mb-3" />
            <p className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
              Đã tạo bộ đề thành công!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Chủ đề: {result.topic}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {result.question_count} câu hỏi · Độ khó:{" "}
              {DIFFICULTIES.find((d) => d.value === result.difficulty)?.label ||
                result.difficulty}
            </p>

            <div className="flex items-center gap-2 max-w-md mx-auto mb-6">
              <Input value={shareLink} readOnly />
              <Button
                icon={<Copy className="w-4 h-4" />}
                onClick={handleCopyLink}
              >
                Sao chép
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={`/explore/quiz?shared=${result.quiz_set_id}`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#319527] hover:bg-[#3dbb31] text-white transition-colors"
              >
                <Play className="w-4 h-4" />
                Chơi ngay
              </Link>
              <button
                onClick={handleCreateAnother}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:border-[#319527] transition-colors"
              >
                <PencilLine className="w-4 h-4" />
                Tạo bộ đề khác
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6">
            {errorMessage && (
              <Alert
                type="error"
                message={errorMessage}
                showIcon
                closable
                onClose={() => setErrorMessage("")}
                className="mb-4"
              />
            )}

            <div className="mb-5">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                Tiêu đề <span className="text-gray-400 font-normal">(tùy chọn)</span>
              </p>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                showCount
                placeholder="Bộ đề tùy chỉnh"
              />
            </div>

            <div className="mb-5">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Độ khó</p>
              <Select
                value={difficulty}
                onChange={setDifficulty}
                options={DIFFICULTIES}
                className="w-full sm:w-52"
              />
            </div>

            <div className="mb-5">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Nội dung câu hỏi</p>
              <Tabs
                activeKey={mode}
                onChange={setMode}
                items={[
                  { key: "type", label: "Nhập nội dung" },
                  { key: "upload", label: "Tải file lên" },
                ]}
              />

              {mode === "type" ? (
                <div>
                  <EditorToolbar editor={editor} />
                  <div className="border border-gray-200 dark:border-neutral-600 rounded-b-lg px-3 py-2 min-h-[220px] bg-white dark:bg-neutral-900 quiz-editor-content">
                    <EditorContent editor={editor} />
                  </div>
                  <div className="mt-3 bg-gray-50 dark:bg-neutral-700 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Cách viết câu hỏi:
                    </p>
                    <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-sans">
                      {EXAMPLE_TEXT}
                    </pre>
                    <p className="text-xs text-gray-400 mt-1">
                      Mỗi câu bắt đầu bằng &quot;Câu N:&quot;, các đáp án đánh dấu A/B/C/D
                      (tối thiểu 2 đáp án). Đánh dấu đúng MỘT đáp án đúng bằng cách in đậm,
                      gạch chân hoặc tô màu chữ khác màu đen mặc định - nếu không hệ thống sẽ
                      bỏ qua câu hỏi đó. Có thể thêm dòng &quot;Giải thích:&quot; sau mỗi câu.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload.Dragger
                    accept=".docx,.txt,.pdf"
                    maxCount={1}
                    beforeUpload={beforeUpload}
                    onRemove={handleRemoveFile}
                    fileList={
                      file
                        ? [{ uid: "-1", name: file.name, status: "done" }]
                        : []
                    }
                    className="mt-2"
                  >
                    <p className="text-3xl flex justify-center mb-2">
                      <UploadCloud className="w-8 h-8 text-[#319527]" />
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      Kéo thả tệp vào đây, hoặc bấm để chọn tệp
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Hỗ trợ .docx, .txt, .pdf - tối đa 10MB
                    </p>
                  </Upload.Dragger>
                  {fileError && (
                    <p className="text-xs text-red-500 mt-2">{fileError}</p>
                  )}
                  <div className="mt-3 bg-gray-50 dark:bg-neutral-700 rounded-lg p-3 flex flex-col gap-1.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>.docx:</strong> giữ nguyên định dạng in đậm/gạch
                        chân/tô màu để đánh dấu đáp án đúng.
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>.txt:</strong> dùng quy ước văn bản, ví dụ{" "}
                        <code>**đáp án đúng**</code> hoặc <code>&lt;u&gt;đáp án đúng&lt;/u&gt;</code>{" "}
                        (không hỗ trợ tô màu).
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>.pdf:</strong> định dạng thường KHÔNG được giữ lại -
                        nên ghi rõ ràng như &quot;Đáp án: B&quot; sau mỗi câu.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {submitting ? "Đang tạo bộ đề..." : "Tạo bộ đề"}
            </button>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
