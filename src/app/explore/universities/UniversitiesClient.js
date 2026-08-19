"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Select, Spin, Empty, Typography, Tag, Tooltip } from "antd";
import { Globe, Phone, MapPin, GraduationCap, ChevronDown, ChevronUp, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const { Text, Title } = Typography;

const EMPTY_OPTIONS = { city: [], major: [], type: [], subjectComposition: [] };

const SCORE_OPTIONS = [
  { label: "Dưới 15", value: [0, 15] },
  { label: "15 – 18", value: [15, 18] },
  { label: "18 – 20", value: [18, 20] },
  { label: "20 – 22", value: [20, 22] },
  { label: "22 – 24", value: [22, 24] },
  { label: "Trên 24", value: [24, 30] },
];

const TYPE_MAP = { "Công lập": 0, "Dân lập": 1 };

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com") +
  "/v1.0/universities";

// Hardcoded from /composer/university_hub?offset=all (2025-08)
const STATIC_GENERAL_INFO = [
  {
    title: "Hướng dẫn tuyển sinh đại học, tuyển sinh cao đẳng",
    url: "https://xaydungchinhsach.chinhphu.vn/cong-van-2457-bgddt-gddh-huong-dan-tuyen-sinh-dai-hoc-cao-dang-nam-2025-119250519205051545.htm",
    publishDate: "Bộ GDĐT ban hành ngày 19/05/2025",
  },
  {
    title: "Sửa đổi, bổ sung một số điều của Quy chế tuyển sinh đại học, cao đẳng ngành GDMN",
    url: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/3/06-bgddt.pdf",
    publishDate: "Bộ GDĐT ban hành ngày 19/03/2025",
  },
  {
    title: "Quy chế tuyển sinh THCS và tuyển sinh THPT",
    url: "https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-30-2024-TT-BGDDT-Quy-che-tuyen-sinh-trung-hoc-co-so-va-tuyen-sinh-trung-hoc-pho-thong-628767.aspx",
    publishDate: "Bộ GDĐT ban hành ngày 30/12/2024",
  },
  {
    title: "Quy chế thi tốt nghiệp THPT",
    url: "https://xaydungchinhsach.chinhphu.vn/toan-van-thong-tu-24-2024-tt-bgddt-ban-hanh-quy-che-thi-tot-nghiep-thpt-119250109172801928.htm",
    publishDate: "Bộ GDĐT ban hành ngày 24/12/2024",
  },
  {
    title: "Quy chế tuyển sinh ĐH, CĐ ngành GDMN năm 2024",
    url: "https://thuvienphapluat.vn/cong-van/Giao-duc/Cong-van-1957-BGDDT-GDDH-2024-huong-dan-tuyen-sinh-dai-hoc-Giao-duc-Mam-non-608595.aspx",
    publishDate: "Bộ GDĐT ban hành ngày 26/04/2024",
  },
];

function UniversityCard({ uni }) {
  const [expanded, setExpanded] = useState(false);
  const visibleMajors = expanded ? uni.universityMajors : uni.universityMajors?.slice(0, 4);
  const typeColor = uni.type === "Công lập" ? "blue" : uni.type === "Dân lập" ? "green" : "default";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <GraduationCap size={18} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug mb-1.5">
            {uni.name}
            {uni.acronym ? ` (${uni.acronym})` : ""}
          </p>
          <div className="flex flex-wrap gap-1">
            {uni.type && <Tag color={typeColor} className="text-xs !m-0">{uni.type}</Tag>}
            {uni.city?.map((c) => (
              <Tag key={c} className="text-xs !m-0">{c}</Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {uni.address && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={12} className="flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{uni.address}</span>
          </div>
        )}
        {uni.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Phone size={12} className="flex-shrink-0" />
            <span>{uni.phone}</span>
          </div>
        )}
        {uni.website && (
          <div className="flex items-center gap-2 text-xs">
            <Globe size={12} className="flex-shrink-0 text-gray-400" />
            <a
              href={uni.website.startsWith("http") ? uni.website : `https://${uni.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline truncate"
            >
              {uni.website}
            </a>
          </div>
        )}
      </div>

      {uni.universityMajors?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Ngành đào tạo
          </p>
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {visibleMajors.map((m, i) => {
              const years = Object.entries(m.scores || {}).sort(([a], [b]) => Number(b) - Number(a));
              return (
                <div key={i} className="flex items-start justify-between gap-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-snug">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.code}</p>
                  </div>
                  {years.length > 0 && (
                    <Tooltip title={years.map(([y, s]) => `${y}: ${s}`).join(" | ")}>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-500">{years[0][1]}</p>
                        <p className="text-xs text-gray-400">{years[0][0]}</p>
                      </div>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
          {uni.universityMajors.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              {expanded ? (
                <><ChevronUp size={12} /> Thu gọn</>
              ) : (
                <><ChevronDown size={12} /> Xem thêm {uni.universityMajors.length - 4} ngành</>
              )}
            </button>
          )}
        </div>
      )}

      {uni.urls?.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {uni.urls.map((u, i) => (
            <a
              key={i}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 dark:text-green-400 hover:underline truncate"
            >
              {i === 0 ? "Xem trang tuyển sinh →" : `Trang tuyển sinh ${i + 1} →`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UniversitiesClient() {
  const [tab, setTab] = useState("filter"); // "filter" | "search"

  const [filterOptions, setFilterOptions] = useState(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [generalInfo, setGeneralInfo] = useState(STATIC_GENERAL_INFO);

  // filter state
  const [cityIdx, setCityIdx] = useState(null);
  const [typeIdx, setTypeIdx] = useState(null);
  const [majorIdx, setMajorIdx] = useState(null);
  const [subjectIdx, setSubjectIdx] = useState(null);
  const [scoreRange, setScoreRange] = useState(null); // [min, max]

  // results
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);

  // search by name
  const [nameQuery, setNameQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [nameResults, setNameResults] = useState([]);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSearched, setNameSearched] = useState(false);
  const suggestTimer = useRef(null);

  // Silently refresh filter options + load generalInfo from API
  useEffect(() => {
    fetch(`${API_BASE}/options`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.city?.length > 0) setFilterOptions(d);
        if (d?.generalInfo?.length > 0) setGeneralInfo(d.generalInfo);
      })
      .catch(() => {})
      .finally(() => setOptionsLoading(false));
  }, []);

  const fetchUniversities = useCallback(
    async (page = 1) => {
      const params = new URLSearchParams({ offset: String(page) });
      if (cityIdx !== null) params.set("city", String(cityIdx));
      if (typeIdx !== null) params.set("type", String(typeIdx));
      if (majorIdx !== null) params.set("major", String(majorIdx));
      if (subjectIdx !== null) params.set("subjectComposition", String(subjectIdx));
      if (scoreRange) params.set("score", `${scoreRange[0]},${scoreRange[1]}`);

      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(`${API_BASE}?${params}`);
        const data = await res.json();
        setUniversities(data?.universities ?? []);
        setCurrentPage(data?.currentPage ?? page);
        setMaxPage(data?.maxPage ?? 1);
      } catch {
        setUniversities([]);
      } finally {
        setLoading(false);
      }
    },
    [cityIdx, typeIdx, majorIdx, subjectIdx, scoreRange]
  );

  const handleFilterSearch = () => {
    setCurrentPage(1);
    fetchUniversities(1);
  };

  const handlePage = (p) => {
    setCurrentPage(p);
    fetchUniversities(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNameInput = (e) => {
    const q = e.target.value;
    setNameQuery(q);
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&autocomplete=1`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);
  };

  const handleNameSearch = async (q = nameQuery) => {
    if (!q.trim()) return;
    setSuggestions([]);
    setNameLoading(true);
    setNameSearched(true);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setNameResults(Array.isArray(data) ? data : []);
    } catch {
      setNameResults([]);
    } finally {
      setNameLoading(false);
    }
  };

  const sidebarItems = EXPLORE_FEATURES.map((f) => ({
    key: f.key,
    href: f.href,
    label: f.title,
    Icon: f.sidebarIcon,
    isExternal: false,
  }));

  const cityOptions = filterOptions.city.map((name, i) => ({ value: i, label: name }));
  const majorOptions = filterOptions.major.map((name, i) => ({ value: i, label: name }));
  const typeOptions = filterOptions.type.map((name, i) => ({ value: i, label: name }));
  const subjectOptions = filterOptions.subjectComposition.map((code, i) => ({ value: i, label: code }));

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="universities"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      <div className="px-2.5">
        <main className="px-1 py-4 md:max-w-[936px] mx-auto">
          {/* Header */}
          <div className="mb-5">
            <Title level={3} className="!text-gray-900 dark:!text-gray-100 !mb-1">
              Tìm trường Đại học - Cao đẳng
            </Title>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              Tra cứu thông tin trường và điểm chuẩn tuyển sinh.
            </Text>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-5 border-b border-gray-200 dark:border-neutral-700">
            {[
              { key: "filter", icon: <SlidersHorizontal size={14} />, label: "Bộ lọc" },
              { key: "search", icon: <Search size={14} />, label: "Tìm theo tên" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter tab */}
          {tab === "filter" && (
            <div className="mb-5 space-y-3">
              {optionsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <Spin size="small" />
                  Đang tải bộ lọc...
                </div>
              ) : (
                <>
                  <div id="uni-filter-container" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      placeholder="TP / Tỉnh"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      size="large"
                      value={cityIdx}
                      onChange={setCityIdx}
                      options={cityOptions}
                      className="w-full uni-select"
                      getPopupContainer={() => document.getElementById("uni-filter-container") || document.body}
                      listHeight={220}
                    />
                    <Select
                      placeholder="Loại hình"
                      allowClear
                      size="large"
                      value={typeIdx}
                      onChange={setTypeIdx}
                      options={typeOptions}
                      className="w-full uni-select"
                      getPopupContainer={() => document.getElementById("uni-filter-container") || document.body}
                    />
                    <Select
                      placeholder="Ngành học"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      size="large"
                      value={majorIdx}
                      onChange={setMajorIdx}
                      options={majorOptions}
                      className="w-full uni-select"
                      getPopupContainer={() => document.getElementById("uni-filter-container") || document.body}
                      listHeight={220}
                    />
                    <Select
                      placeholder="Khối thi"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      size="large"
                      value={subjectIdx}
                      onChange={setSubjectIdx}
                      options={subjectOptions}
                      className="w-full uni-select"
                      getPopupContainer={() => document.getElementById("uni-filter-container") || document.body}
                      listHeight={220}
                    />
                    <Select
                      placeholder="Điểm chuẩn"
                      allowClear
                      size="large"
                      value={scoreRange ? `${scoreRange[0]},${scoreRange[1]}` : null}
                      onChange={(v) => setScoreRange(v ? v.split(",").map(Number) : null)}
                      className="w-full uni-select"
                      getPopupContainer={() => document.getElementById("uni-filter-container") || document.body}
                      options={SCORE_OPTIONS.map((o) => ({
                        value: `${o.value[0]},${o.value[1]}`,
                        label: o.label,
                      }))}
                    />
                  </div>
                  <button
                    onClick={handleFilterSearch}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
                  >
                    Tìm kiếm
                  </button>
                </>
              )}
            </div>
          )}

          {/* Search by name tab */}
          {tab === "search" && (
            <div className="mb-5 relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={handleNameInput}
                    onKeyDown={(e) => e.key === "Enter" && handleNameSearch()}
                    placeholder="Nhập tên hoặc mã trường..."
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-green-500 dark:focus:border-green-500"
                  />
                  {suggestLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Spin size="small" />
                    </div>
                  )}
                  {/* Suggestions dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setNameQuery(s.name);
                            setSuggestions([]);
                            handleNameSearch(s.name);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 border-b border-gray-100 dark:border-neutral-700 last:border-0"
                        >
                          <span className="font-medium">{s.name}</span>
                          {s.universityCode && (
                            <span className="ml-2 text-xs text-gray-400">({s.universityCode})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleNameSearch()}
                  disabled={!nameQuery.trim() || nameLoading}
                  className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Search size={14} />
                  Tìm
                </button>
              </div>
            </div>
          )}

          {/* Results - filter tab */}
          {tab === "filter" && (
            <>
              {loading ? (
                <div className="flex justify-center py-16"><Spin size="large" /></div>
              ) : searched && universities.length === 0 ? (
                <Empty
                  description={<span className="text-gray-500 dark:text-gray-400">Không tìm thấy trường nào phù hợp</span>}
                  className="py-16"
                />
              ) : universities.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Tìm thấy{" "}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{universities.length}</span>{" "}
                      trường · Trang {currentPage}/{maxPage}
                    </Text>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {universities.map((uni, i) => (
                      <UniversityCard key={uni.universityCode ?? i} uni={uni} />
                    ))}
                  </div>
                  {maxPage > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: maxPage }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            p === currentPage
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                !searched && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <GraduationCap size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                    <Text className="text-gray-400 dark:text-gray-500">
                      Chọn bộ lọc rồi nhấn Tìm kiếm
                    </Text>
                  </div>
                )
              )}
            </>
          )}

          {/* Results - search by name tab */}
          {tab === "search" && (
            <>
              {nameLoading ? (
                <div className="flex justify-center py-16"><Spin size="large" /></div>
              ) : nameSearched && nameResults.length === 0 ? (
                <Empty
                  description={<span className="text-gray-500 dark:text-gray-400">Không tìm thấy trường nào</span>}
                  className="py-16"
                />
              ) : nameResults.length > 0 ? (
                <>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3 block">
                    Tìm thấy <span className="font-semibold text-gray-800 dark:text-gray-200">{nameResults.length}</span> trường
                  </Text>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {nameResults.map((uni, i) => (
                      <UniversityCard key={uni.universityCode ?? i} uni={uni} />
                    ))}
                  </div>
                </>
              ) : (
                !nameSearched && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                    <Text className="text-gray-400 dark:text-gray-500">
                      Nhập tên hoặc mã trường để tìm kiếm
                    </Text>
                  </div>
                )
              )}
            </>
          )}
          {/* Quy chế tuyển sinh section — shown below the school list */}
          {generalInfo.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
                Quy chế tuyển sinh đại học
              </h2>
              <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
                {generalInfo.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors border-b border-gray-100 dark:border-neutral-700 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">
                        {item.title}
                      </p>
                      {item.publishDate && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.publishDate}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </HomeLayout>
  );
}
