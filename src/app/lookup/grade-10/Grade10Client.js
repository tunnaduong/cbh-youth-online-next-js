"use client";

import { useState } from "react";
import { Button, Input } from "antd";
import { AlertTriangle, BookOpen, CheckCircle2, School, XCircle } from "lucide-react";
import LookupShell, { ScoreRows, errorText, showValue } from "@/components/lookup/LookupShell";
import { HomeCard, SectionHeader } from "@/components/home/HomeCard";
import { searchGrade10Score } from "@/app/Api";

const CHANCE = {
  likely: {
    Icon: CheckCircle2,
    box: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
    text: (r) => `Khả năng đỗ cao: hạng #${r.xep_hang} nằm trong ${r.chi_tieu} chỉ tiêu.`,
  },
  borderline: {
    Icon: AlertTriangle,
    box: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
    text: (r) => `Cần cân nhắc: hạng #${r.xep_hang} sát mức ${r.chi_tieu} chỉ tiêu.`,
  },
  unlikely: {
    Icon: XCircle,
    box: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30",
    icon: "text-red-500 dark:text-red-400",
    text: (r) => `Khả năng trượt: hạng #${r.xep_hang} vượt ${r.chi_tieu} chỉ tiêu.`,
  },
};

// Thi vào lớp 10 Ninh Bình (data from diemthininhbinh-ten.vercel.app via the
// API). No captcha; the first two digits of the SBD are the school code.
export default function Grade10Client() {
  const [sbd, setSbd] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const valid = /^\d{6,10}$/.test(sbd.trim());

  const submit = async (e) => {
    e?.preventDefault();
    if (!valid || searching) return;
    setSearching(true);
    setError("");
    setResult(null);
    try {
      const res = await searchGrade10Score(sbd.trim());
      setResult(res.data);
    } catch (err) {
      setError(errorText(err, "Không tra cứu được, vui lòng thử lại."));
    } finally {
      setSearching(false);
    }
  };

  return (
    <LookupShell
      title="Thi vào lớp 10"
      subtitle="Nhập số báo danh thi vào lớp 10 Ninh Bình (2 số đầu là mã trường) để xem điểm, tổng điểm và thứ hạng trong trường."
      backHref="/lookup"
    >
      <HomeCard className="p-4 sm:p-5">
        <form onSubmit={submit} className="max-w-sm space-y-4">
          <div>
            <label htmlFor="g10-sbd" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số báo danh
            </label>
            <Input
              id="g10-sbd"
              value={sbd}
              onChange={(e) => setSbd(e.target.value.replace(/\D/g, ""))}
              placeholder="Ví dụ: 05xxxx"
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <Button type="primary" htmlType="submit" loading={searching} disabled={!valid} block>
            Tra cứu
          </Button>
        </form>
      </HomeCard>

      {result && <Grade10Result result={result} />}
    </LookupShell>
  );
}

function Grade10Result({ result }) {
  const chance = CHANCE[result.chance];
  const percentile =
    result.xep_hang && result.tong_so
      ? Math.round((1 - (result.xep_hang - 1) / result.tong_so) * 100)
      : null;
  const rankHint = (rank) => (rank !== null && rank !== undefined && rank !== "" ? `Hạng ${rank} trong trường` : undefined);

  return (
    <>
      <HomeCard className="p-4 sm:p-5">
        <SectionHeader icon={School} title={`Kết quả - SBD ${result.sbd}`} />
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Trường đăng ký</p>
        <p className="text-base font-semibold text-gray-900 dark:text-white">{result.school_name}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Tổng điểm" value={showValue(result.tong)} accent />
          <Stat
            label="Thứ hạng"
            value={result.xep_hang ? `#${result.xep_hang}` : "—"}
            hint={result.tong_so ? `trên ${result.tong_so}` : undefined}
          />
          <Stat label="Chỉ tiêu" value={showValue(result.chi_tieu)} />
        </div>
        {percentile !== null && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Bạn đứng trên {percentile}% thí sinh cùng trường.
          </p>
        )}
        {chance && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-3 ${chance.box}`}>
            <chance.Icon className={`h-[18px] w-[18px] flex-shrink-0 ${chance.icon}`} />
            <p className="text-sm text-gray-700 dark:text-gray-300">{chance.text(result)}</p>
          </div>
        )}
      </HomeCard>

      <HomeCard className="p-4 sm:p-5">
        <SectionHeader icon={BookOpen} title="Điểm từng môn" />
        <div className="mt-2">
          <ScoreRows
            rows={[
              { label: "Ngữ văn", value: showValue(result.van), hint: rankHint(result.hang_van) },
              { label: "Toán", value: showValue(result.toan), hint: rankHint(result.hang_toan) },
              { label: "Ngoại ngữ", value: showValue(result.ngoai_ngu), hint: rankHint(result.hang_nn) },
            ]}
          />
        </div>
      </HomeCard>
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">
        Thứ hạng và khả năng đỗ chỉ để tham khảo, kết quả chính thức theo thông báo của Sở GD&ĐT.
      </p>
    </>
  );
}

function Stat({ label, value, hint, accent }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 px-2 py-3 text-center dark:bg-neutral-800">
      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-0.5 truncate text-xl font-bold ${
          accent ? "text-primary-500 dark:text-[#6bcf60]" : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </p>
      {hint && <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
