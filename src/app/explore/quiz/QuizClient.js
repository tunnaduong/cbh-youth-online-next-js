"use client";

import { useState } from "react";
import { message } from "antd";
import { useRouter } from "@bprogress/next/app";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { startQuiz, submitQuiz } from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const COUNT_PRESETS = [5, 10, 20, 50, 100];
const DIFFICULTIES = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

export default function QuizClient() {
  const { loggedIn } = useAuthContext();
  const router = useRouter();

  // phase: "setup" -> "taking" -> "result"
  const [phase, setPhase] = useState("setup");
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [useCustomCount, setUseCustomCount] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const [quiz, setQuiz] = useState(null); // { quiz_set_id, topic, difficulty, question_count, questions }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: "A" }
  const [result, setResult] = useState(null); // { score, total, results }
  const [submitting, setSubmitting] = useState(false);

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

  const resolvedCount = useCustomCount
    ? Math.max(1, Math.min(100, parseInt(customCount, 10) || 0))
    : count;

  const handleStart = async () => {
    if (!loggedIn) {
      message.error("Vui lòng đăng nhập để làm bài đố vui");
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }
    if (useCustomCount && (!customCount || resolvedCount < 1)) {
      message.error("Vui lòng nhập số câu hỏi hợp lệ (1-100)");
      return;
    }

    setLoading(true);
    try {
      const res = await startQuiz(resolvedCount, difficulty);
      const data = res?.data || res;
      setQuiz(data);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setPhase("taking");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Không thể tạo câu hỏi lúc này, vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, letter) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({
        id: q.id,
        answer: answers[q.id] || null,
      }));
      const res = await submitQuiz(quiz.quiz_set_id, payload);
      const data = res?.data || res;
      setResult(data);
      setPhase("result");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể nộp bài, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setPhase("setup");
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  const answeredCount = quiz ? Object.keys(answers).length : 0;

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <HelpCircle className="w-6 h-6 text-[#319527]" />
          Đố vui
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Trả lời câu hỏi trắc nghiệm do AI tạo ra, thử thách kiến thức của bạn.
        </p>

        {phase === "setup" && (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6">
            <div className="mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Số câu hỏi</p>
              <div className="flex flex-wrap gap-2">
                {COUNT_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCount(c);
                      setUseCustomCount(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      !useCustomCount && count === c
                        ? "bg-[#319527] text-white border-[#319527]"
                        : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                    }`}
                  >
                    {c} câu
                  </button>
                ))}
                <button
                  onClick={() => setUseCustomCount(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    useCustomCount
                      ? "bg-[#319527] text-white border-[#319527]"
                      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                  }`}
                >
                  Tùy chỉnh
                </button>
              </div>
              {useCustomCount && (
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder="Nhập số câu (1-100)"
                  className="mt-3 w-full sm:w-52 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#319527]"
                />
              )}
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Độ khó</p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      difficulty === d.value
                        ? "bg-[#319527] text-white border-[#319527]"
                        : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {loading ? "Đang tạo câu hỏi..." : "Bắt đầu"}
            </button>
          </div>
        )}

        {phase === "taking" && quiz && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chủ đề</p>
                <p className="font-semibold text-gray-900 dark:text-white">{quiz.topic}</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Đã trả lời {answeredCount}/{quiz.question_count}
              </p>
            </div>

            <div className="w-full h-2 bg-gray-100 dark:bg-neutral-700 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#319527] transition-all"
                style={{ width: `${(answeredCount / quiz.question_count) * 100}%` }}
              />
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6 mb-4">
              <p className="text-xs text-gray-400 mb-2">
                Câu {currentIndex + 1}/{quiz.question_count}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mb-4 text-base">
                {quiz.questions[currentIndex].question}
              </p>
              <div className="flex flex-col gap-2">
                {quiz.questions[currentIndex].options.map((opt) => {
                  const letter = opt.trim().charAt(0);
                  const selected = answers[quiz.questions[currentIndex].id] === letter;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(quiz.questions[currentIndex].id, letter)}
                      className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                        selected
                          ? "bg-[#319527]/10 border-[#319527] text-[#319527] dark:text-[#6bcf60] font-medium"
                          : "bg-gray-50 dark:bg-neutral-700 border-transparent text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-neutral-500"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-600 text-gray-700 dark:text-gray-200 disabled:opacity-40"
              >
                Câu trước
              </button>
              {currentIndex < quiz.question_count - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(quiz.question_count - 1, i + 1))}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#319527] hover:bg-[#3dbb31] text-white"
                >
                  Câu tiếp theo
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 rounded-full text-sm font-semibold bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-60 text-white"
                >
                  {submitting ? "Đang nộp bài..." : "Nộp bài"}
                </button>
              )}
            </div>

            {/* Question jump dots */}
            <div className="flex flex-wrap gap-1.5 mt-6">
              {quiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border transition-colors ${
                    i === currentIndex
                      ? "bg-[#319527] text-white border-[#319527]"
                      : answers[q.id]
                      ? "bg-[#319527]/10 text-[#319527] border-[#319527]/30"
                      : "bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 border-transparent"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "result" && result && quiz && (
          <div>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6 mb-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kết quả</p>
              <p className="text-4xl font-bold text-[#319527] mb-1">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Chủ đề: {quiz.topic}
              </p>
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#319527] hover:bg-[#3dbb31] text-white"
              >
                <RotateCcw className="w-4 h-4" />
                Làm bài mới
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {quiz.questions.map((q) => {
                const r = result.results.find((item) => item.id === q.id);
                if (!r) return null;
                return (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {r.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-[#319527] flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-gray-900 dark:text-white">{q.question}</p>
                    </div>
                    <div className="pl-7 flex flex-col gap-1">
                      {q.options.map((opt) => {
                        const letter = opt.trim().charAt(0);
                        const isCorrect = letter === r.correct_answer;
                        const isYours = letter === r.your_answer;
                        return (
                          <p
                            key={opt}
                            className={`text-sm px-2 py-1 rounded ${
                              isCorrect
                                ? "text-[#319527] font-semibold"
                                : isYours
                                ? "text-red-500 font-semibold"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {opt}
                            {isCorrect ? " ✓" : isYours ? " ✗" : ""}
                          </p>
                        );
                      })}
                      {r.explanation && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                          {r.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
