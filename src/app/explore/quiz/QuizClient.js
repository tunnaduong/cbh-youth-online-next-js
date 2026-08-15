"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { message } from "antd";
import { useRouter } from "@bprogress/next/app";
import { useSearchParams } from "next/navigation";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Trophy,
  Share2,
  ExternalLink,
  PencilLine,
} from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { openDeepLink, isMobileDevice } from "@/lib/deepLink";
import {
  startQuiz,
  answerQuizQuestion,
  getQuizLeaderboard,
  getQuizTopics,
  joinQuiz,
} from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const COUNT_PRESETS = [5, 10, 20, 50];
const MAX_COUNT = 50;
const DIFFICULTIES = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];
const GRADES = [
  { value: "10", label: "Lớp 10" },
  { value: "11", label: "Lớp 11" },
  { value: "12", label: "Lớp 12" },
];
const RANDOM_TOPIC = "Ngẫu nhiên";
const OTHER_TOPIC = "Khác";

// Embedded in the mobile app's WebView (?app=true) - the app shows its own
// native toasts/alerts for these, so a web toast on top would double up.
function isInAppWebView() {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("app") === "true"
  );
}

export default function QuizClient() {
  const { loggedIn, authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedQuizId = searchParams.get("shared");

  // phase: "setup" -> "taking" -> "result"
  const [phase, setPhase] = useState("setup");
  const [joiningShared, setJoiningShared] = useState(!!sharedQuizId);
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [useCustomCount, setUseCustomCount] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [grade, setGrade] = useState("10");
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState(RANDOM_TOPIC);
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const [quiz, setQuiz] = useState(null); // { quiz_set_id, topic, difficulty, question_count, questions }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: "A" }
  // { [questionId]: { is_correct, correct_answer, explanation } } - filled in
  // the instant each question is answered, see handleSelect.
  const [feedback, setFeedback] = useState({});
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState(null); // { score, total, points, results }
  // Computed the instant the last question is answered, but held back until
  // the user explicitly moves on - see handleSelect/handleViewResult - so
  // they get to see the ✓/✗ feedback on that last question first.
  const [pendingResult, setPendingResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  // Only worth offering on an actual mobile browser that isn't already
  // running inside the app's own WebView (?app=true) - computed in an
  // effect (not read directly during render) so SSR/hydration always
  // start from the same "false" the server saw.
  const [canOpenInApp, setCanOpenInApp] = useState(false);
  useEffect(() => {
    setCanOpenInApp(isMobileDevice() && !isInAppWebView());
  }, []);

  useEffect(() => {
    getQuizLeaderboard("week")
      .then((res) => setLeaderboard((res?.data || res)?.leaderboard || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getQuizTopics()
      .then((res) => {
        const data = res?.data || res;
        setTopics(data?.topics || []);
      })
      .catch(() => {});
  }, []);

  // Opened via a shared quiz link - join that exact set instead of showing
  // the setup screen, so both people answer the same questions.
  useEffect(() => {
    if (!sharedQuizId || authLoading) return;
    if (!loggedIn) {
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await joinQuiz(sharedQuizId);
        const data = res?.data || res;
        if (cancelled) return;

        if (data.status === "completed") {
          setQuiz(data);
          setResult(data.result);
          setPhase("result");
        } else {
          setQuiz(data);
          setAnswers(data.answered || {});
          setFeedback({});
          setCurrentIndex(0);
          setResult(null);
          setPendingResult(null);
          setPhase("taking");
        }
      } catch (error) {
        if (!isInAppWebView()) {
          message.error(error?.response?.data?.message || "Không thể tham gia bài đố vui này.");
        }
      } finally {
        if (!cancelled) setJoiningShared(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sharedQuizId, loggedIn, authLoading]);

  const handleShare = async (quizSetId) => {
    if (!quizSetId) return;
    const link = `${window.location.origin}/explore/quiz?shared=${quizSetId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Đố vui", text: "Cùng thử sức với bài đố vui này nhé!", url: link });
        return;
      } catch {
        // User cancelled the native share sheet, or it's unsupported here -
        // fall back to clipboard below.
      }
    }
    navigator.clipboard.writeText(link);
    message.success("Đã sao chép liên kết vào bộ nhớ tạm");
  };

  const handleOpenInApp = (quizSetId) => {
    openDeepLink("quiz", quizSetId, {
      onFallback: (storeUrl) => {
        if (confirm("Chưa cài app? Tải về ngay để trải nghiệm tốt nhất!")) {
          window.location.href = storeUrl;
        }
      },
      delay: isMobileDevice() ? 2000 : 2500,
    });
  };

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
    ? Math.max(1, Math.min(MAX_COUNT, parseInt(customCount, 10) || 0))
    : count;

  const handleStart = async () => {
    if (!loggedIn) {
      message.error("Vui lòng đăng nhập để làm bài đố vui");
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
      return;
    }
    if (useCustomCount && (!customCount || resolvedCount < 1)) {
      message.error(`Vui lòng nhập số câu hỏi hợp lệ (1-${MAX_COUNT})`);
      return;
    }
    if (topic === OTHER_TOPIC && !customTopic.trim()) {
      message.error("Vui lòng nhập chủ đề bạn muốn");
      return;
    }

    setLoading(true);
    try {
      const res = await startQuiz(
        resolvedCount,
        difficulty,
        topic,
        grade,
        topic === OTHER_TOPIC ? customTopic.trim() : undefined
      );
      const data = res?.data || res;
      setQuiz(data);
      setAnswers({});
      setFeedback({});
      setCurrentIndex(0);
      setResult(null);
      setPendingResult(null);
      setPhase("taking");
    } catch (error) {
      if (!isInAppWebView()) {
        message.error(
          error?.response?.data?.message || "Không thể tạo câu hỏi lúc này, vui lòng thử lại."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Grades the question the instant it's answered - no separate "submit"
  // step. Once the last question in the set is answered, the API finalizes
  // the play and returns the final score/points - but we hold off switching
  // to the result screen until the user taps "Xem kết quả" (see
  // handleViewResult) so they get to see the ✓/✗ feedback on that last
  // question first instead of jumping straight to the summary.
  const handleSelect = async (questionId, letter) => {
    if (!quiz || feedback[questionId] || answering) return; // already answered / a request in flight
    setAnswering(true);
    try {
      const res = await answerQuizQuestion(quiz.quiz_set_id, questionId, letter);
      const data = res?.data || res;
      const nextAnswers = { ...answers, [questionId]: letter };
      const nextFeedback = { ...feedback, [questionId]: data };
      setAnswers(nextAnswers);
      setFeedback(nextFeedback);

      if (data.finished) {
        setPendingResult({
          score: data.score,
          total: data.total,
          points: data.points,
          results: quiz.questions.map((q) => ({
            id: q.id,
            your_answer: nextAnswers[q.id] ?? null,
            correct_answer: nextFeedback[q.id]?.correct_answer,
            is_correct: nextFeedback[q.id]?.is_correct,
            explanation: nextFeedback[q.id]?.explanation,
          })),
        });
      }
    } catch (error) {
      if (!isInAppWebView()) {
        message.error(
          error?.response?.data?.message || "Không thể ghi nhận câu trả lời, vui lòng thử lại."
        );
      }
    } finally {
      setAnswering(false);
    }
  };

  const handleViewResult = () => {
    if (!pendingResult) return;
    setResult(pendingResult);
    setPhase("result");
  };

  const handleRestart = () => {
    setPhase("setup");
    setQuiz(null);
    setResult(null);
    setPendingResult(null);
    setAnswers({});
    setFeedback({});
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
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#319527]" />
            Đố vui
          </h1>
          {quiz?.quiz_set_id && (phase === "taking" || phase === "result") && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {canOpenInApp && (
                <button
                  onClick={() => handleOpenInApp(quiz.quiz_set_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#319527] text-white hover:bg-[#3dbb31] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở trong app
                </button>
              )}
              <button
                onClick={() => handleShare(quiz.quiz_set_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:border-[#319527] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Chia sẻ
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Trả lời câu hỏi trắc nghiệm do AI tạo ra, thử thách kiến thức của bạn.
        </p>

        {joiningShared ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#319527]" />
          </div>
        ) : (
        <>
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
                  max={MAX_COUNT}
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  placeholder={`Nhập số câu (1-${MAX_COUNT})`}
                  className="mt-3 w-full sm:w-52 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#319527]"
                />
              )}
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Chủ đề</p>
              <div className="flex flex-wrap gap-2">
                {[RANDOM_TOPIC, ...topics, OTHER_TOPIC].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      topic === t
                        ? "bg-[#319527] text-white border-[#319527]"
                        : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {topic === OTHER_TOPIC && (
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Nhập chủ đề bạn muốn (VD: Bóng đá, Âm nhạc...)"
                  maxLength={256}
                  className="mt-3 w-full sm:w-80 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#319527]"
                />
              )}
            </div>

            <div className="mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Lớp</p>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGrade(g.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      grade === g.value
                        ? "bg-[#319527] text-white border-[#319527]"
                        : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
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

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-full transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? "Đang tạo câu hỏi..." : "AI tạo đề"}
              </button>
              <Link
                href="/explore/quiz/custom"
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 dark:border-neutral-600 hover:border-[#319527] text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-full transition-colors"
              >
                <PencilLine className="w-5 h-5" />
                Tạo bộ đề tùy chỉnh
              </Link>
            </div>
          </div>
        )}

        {phase === "setup" && (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Bảng xếp hạng đố vui
              </h3>
              <span className="text-xs text-gray-400">Tuần này</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Chưa có dữ liệu
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((u, i) => (
                  <Link
                    href={`/${u.username}`}
                    key={u.id}
                    className="flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg p-1.5 -mx-1.5"
                  >
                    <span
                      className={`w-5 text-center text-sm font-bold ${
                        i === 0
                          ? "text-yellow-500"
                          : i === 1
                          ? "text-gray-400"
                          : i === 2
                          ? "text-amber-700"
                          : "text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                      {u.profile_name}
                    </span>
                    <span className="text-xs font-semibold text-[#319527]">
                      {u.points} điểm
                    </span>
                  </Link>
                ))}
              </div>
            )}
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

            {(() => {
              const currentQuestion = quiz.questions[currentIndex];
              const currentFeedback = feedback[currentQuestion.id];
              return (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 p-6 mb-4">
                  <p className="text-xs text-gray-400 mb-2">
                    Câu {currentIndex + 1}/{quiz.question_count}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-4 text-base">
                    {currentQuestion.question}
                  </p>
                  <div className="flex flex-col gap-2">
                    {currentQuestion.options.map((opt, optIndex) => {
                      if (opt.trim() === "") return null;
                      const letter = ["A", "B", "C", "D"][optIndex];
                      const selected = answers[currentQuestion.id] === letter;
                      const isCorrectOption = currentFeedback && letter === currentFeedback.correct_answer;
                      const isWrongSelected = currentFeedback && selected && !currentFeedback.is_correct;
                      let stateClasses =
                        "bg-gray-50 dark:bg-neutral-700 border-transparent text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-neutral-500";
                      if (currentFeedback) {
                        if (isCorrectOption) {
                          stateClasses = "bg-[#319527]/10 border-[#319527] text-[#319527] dark:text-[#6bcf60] font-medium";
                        } else if (isWrongSelected) {
                          stateClasses = "bg-red-500/10 border-red-500 text-red-500 font-medium";
                        } else {
                          stateClasses = "bg-gray-50 dark:bg-neutral-700 border-transparent text-gray-500 dark:text-gray-400";
                        }
                      } else if (selected) {
                        stateClasses = "bg-[#319527]/10 border-[#319527] text-[#319527] dark:text-[#6bcf60] font-medium";
                      }
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelect(currentQuestion.id, letter)}
                          disabled={!!currentFeedback || answering}
                          className={`text-left px-4 py-3 rounded-xl border transition-colors disabled:cursor-default ${stateClasses}`}
                        >
                          {opt}
                          {isCorrectOption ? " ✓" : isWrongSelected ? " ✗" : ""}
                        </button>
                      );
                    })}
                  </div>
                  {currentFeedback?.explanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                      {currentFeedback.explanation}
                    </p>
                  )}
                </div>
              );
            })()}

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
                  disabled={!feedback[quiz.questions[currentIndex].id]}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-40 text-white"
                >
                  Câu tiếp theo
                </button>
              ) : (
                <button
                  onClick={handleViewResult}
                  disabled={!pendingResult}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-40 text-white"
                >
                  Xem kết quả
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
                      : feedback[q.id]
                      ? feedback[q.id].is_correct
                        ? "bg-[#319527]/10 text-[#319527] border-[#319527]/30"
                        : "bg-red-500/10 text-red-500 border-red-500/30"
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
              {result.points != null && (
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  +{result.points} điểm
                </p>
              )}
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
                      {q.options.map((opt, optIndex) => {
                        if (opt.trim() === "") return null;
                        const letter = ["A", "B", "C", "D"][optIndex];
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
        </>
        )}
      </div>
    </HomeLayout>
  );
}
