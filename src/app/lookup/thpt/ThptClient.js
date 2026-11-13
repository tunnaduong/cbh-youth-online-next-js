"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "antd";
import { Clock, ListChecks, RefreshCw } from "lucide-react";
import LookupShell, { ScoreRows, errorText, showValue } from "@/components/lookup/LookupShell";
import { HomeCard, SectionHeader } from "@/components/home/HomeCard";
import { getExamScoreCaptcha, getExamScoreConfig, searchExamScore } from "@/app/Api";

const SOURCE = "ninh-binh";

const pad = (n) => String(n).padStart(2, "0");
const formatDateTime = (d) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// Thi tốt nghiệp THPT - Sở GD&ĐT Ninh Bình (tracuudiemnb.ninhbinh.edu.vn via the
// API). The site needs a captcha per lookup: we show its image and the visitor
// types the code, as on the original page.
export default function ThptClient() {
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [sbd, setSbd] = useState("");
  const [answer, setAnswer] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const answerRef = useRef(null);
  const [now, setNow] = useState(null);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setAnswer("");
    try {
      const res = await getExamScoreCaptcha(SOURCE);
      setCaptcha(res.data);
    } catch {
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await getExamScoreConfig(SOURCE);
      setConfig(res.data);
      const opensAt = res.data?.start_time ? new Date(res.data.start_time) : null;
      if (!opensAt || opensAt <= new Date()) loadCaptcha();
    } catch {
      setLoadError(true);
    }
  }, [loadCaptcha]);

  useEffect(() => {
    setNow(new Date());
    load();
  }, [load]);

  const submit = async (e) => {
    e?.preventDefault();
    const code = sbd.trim();
    const typed = answer.trim();
    if (!code || !typed || !captcha || searching) return;
    setSearching(true);
    setError("");
    setResult(null);
    try {
      const res = await searchExamScore(SOURCE, {
        so_bao_danh: code,
        captcha_id: captcha.id,
        captcha_answer: typed,
      });
      setResult(res.data);
    } catch (err) {
      setError(errorText(err, "Không tra cứu được, vui lòng thử lại."));
      if (err?.response?.data?.reason === "captcha") setTimeout(() => answerRef.current?.focus(), 0);
    } finally {
      setSearching(false);
      // A captcha is good for one lookup only.
      loadCaptcha();
    }
  };

  const opensAt = config?.start_time ? new Date(config.start_time) : null;
  const pending = opensAt && now && opensAt > now;
  const subtitle = [config?.title, config?.school_year].filter(Boolean).join(" · ") ||
    "Tra cứu điểm thi tốt nghiệp THPT của Sở GD&ĐT Ninh Bình.";

  let body;
  if (loadError) {
    body = (
      <HomeCard className="p-4 sm:p-5">
        <p className="py-6 text-center text-sm text-gray-500 dark:text-neutral-400">
          Không kết nối được cổng tra cứu của Sở.
        </p>
        <div className="flex justify-center">
          <Button onClick={load} shape="round">
            Thử lại
          </Button>
        </div>
      </HomeCard>
    );
  } else if (!config) {
    body = (
      <HomeCard className="animate-pulse space-y-4 p-4 sm:p-5">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-neutral-600" />
      </HomeCard>
    );
  } else if (pending) {
    body = (
      <HomeCard className="p-4 sm:p-5">
        <div className="flex flex-col items-center py-6 text-center">
          <Clock className="h-10 w-10 text-gray-400 dark:text-neutral-400" />
          <p className="mt-3 text-sm text-gray-500 dark:text-neutral-400">
            {config.pending_msg || "Cổng tra cứu chưa mở."} Dự kiến mở lúc{" "}
            {formatDateTime(opensAt)}.
          </p>
        </div>
      </HomeCard>
    );
  } else {
    body = (
      <>
        <HomeCard className="p-4 sm:p-5">
          <form onSubmit={submit} className="max-w-sm space-y-4">
            <div>
              <label htmlFor="thpt-sbd" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số báo danh
              </label>
              <Input
                id="thpt-sbd"
                value={sbd}
                onChange={(e) => setSbd(e.target.value.toUpperCase())}
                placeholder="Nhập số báo danh"
                maxLength={32}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="thpt-captcha" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã xác nhận
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="thpt-captcha"
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                  placeholder="Nhập mã"
                  maxLength={6}
                  autoComplete="off"
                  className="!w-28 font-bold tracking-[0.2em]"
                />
                {/* The captcha draws its own light background, so it reads the same in dark mode. */}
                <div className="flex h-10 w-32 items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-[#f1f5f9] dark:border-neutral-500 dark:bg-[#f1f5f9]">
                  {captcha?.svg && !captchaLoading ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(captcha.svg)}`}
                      alt="Mã xác nhận"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {captchaLoading ? "Đang tải..." : "Không tải được"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={captchaLoading}
                  aria-label="Tải mã xác nhận mới"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-primary-500 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:text-[#6bcf60] dark:hover:bg-neutral-700"
                >
                  <RefreshCw className={`h-4 w-4 ${captchaLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            <Button
              type="primary"
              htmlType="submit"
              loading={searching}
              disabled={!sbd.trim() || !answer.trim() || !captcha}
              block
            >
              Tra cứu
            </Button>
          </form>
        </HomeCard>

        {result && (
          <HomeCard className="p-4 sm:p-5">
            <SectionHeader icon={ListChecks} title={`Kết quả - SBD ${result.so_bao_danh}`} />
            <div className="mt-2">
              {result.subjects?.length ? (
                <ScoreRows rows={result.subjects.map((s) => ({ label: s.name, value: showValue(s.score) }))} />
              ) : (
                <p className="whitespace-pre-wrap py-3 text-[15px] font-medium text-gray-900 dark:text-neutral-100">
                  {showValue(result.diem_thi)}
                </p>
              )}
            </div>
            {result.ghi_chu && (
              <p className="mt-3 text-sm italic text-gray-500 dark:text-gray-400">{result.ghi_chu}</p>
            )}
          </HomeCard>
        )}
      </>
    );
  }

  return (
    <LookupShell title="Thi tốt nghiệp THPT" subtitle={subtitle} backHref="/lookup">
      {body}
    </LookupShell>
  );
}
