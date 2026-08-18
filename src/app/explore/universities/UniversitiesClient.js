"use client";

import { useState } from "react";
import {
  Select,
  Card,
  Tag,
  Spin,
  Empty,
  Typography,
  Tooltip,
} from "antd";
import {
  Home,
  Book,
  Search,
  Map,
  Print,
  HelpCircle,
  GameController,
  Trophy,
  People,
} from "react-ionicons";
import { Globe, Phone, MapPin, GraduationCap, Building2 } from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const { Text, Title, Paragraph } = Typography;

const CITIES = [
  { value: 1, label: "Hồ Chí Minh" },
  { value: 3, label: "Bà Rịa - Vũng Tàu" },
  { value: 6, label: "Bắc Ninh" },
  { value: 12, label: "Cần Thơ" },
  { value: 13, label: "Đà Nẵng" },
  { value: 16, label: "Đồng Nai" },
  { value: 18, label: "Gia Lai" },
  { value: 21, label: "Hải Dương" },
  { value: 22, label: "Hải Phòng" },
  { value: 25, label: "Huế" },
  { value: 26, label: "Hưng Yên" },
  { value: 35, label: "Nam Định" },
  { value: 36, label: "Nghệ An" },
  { value: 40, label: "Phú Yên" },
  { value: 43, label: "Quảng Ngãi" },
  { value: 44, label: "Quảng Ninh" },
  { value: 48, label: "Thái Nguyên" },
];

const MAJORS = [
  { value: 1, label: "Kỹ thuật & Giao thông" },
  { value: 2, label: "Du lịch & Nhà hàng" },
  { value: 3, label: "Hàng hải & Hàng không" },
  { value: 4, label: "Công tác xã hội" },
  { value: 5, label: "Sư phạm" },
  { value: 6, label: "Hóa học & Sinh học" },
  { value: 7, label: "Khoa học & Môi trường" },
  { value: 8, label: "Kinh tế & Tâm lý học" },
  { value: 9, label: "Kinh doanh & Thương mại" },
  { value: 10, label: "Xây dựng" },
  { value: 11, label: "Cơ khí & Điện tử" },
  { value: 12, label: "Công nghệ thông tin" },
  { value: 13, label: "Quản lý môi trường" },
  { value: 14, label: "Nghệ thuật & Mỹ thuật" },
  { value: 15, label: "Ngoại ngữ" },
  { value: 17, label: "Luật" },
  { value: 18, label: "Dệt may & Thời trang" },
  { value: 21, label: "Ngôn ngữ Anh" },
];

function UniversityCard({ uni }) {
  const [expanded, setExpanded] = useState(false);

  const typeColor =
    uni.type === "Công lập"
      ? "blue"
      : uni.type === "Dân lập"
      ? "green"
      : "default";

  const visibleMajors = expanded
    ? uni.universityMajors
    : uni.universityMajors?.slice(0, 4);

  return (
    <Card
      className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-shadow"
      styles={{ body: { padding: "20px" } }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <GraduationCap size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <Title
            level={5}
            className="!mb-1 !text-gray-900 dark:!text-gray-100 leading-tight line-clamp-2"
            style={{ fontSize: 15 }}
          >
            {uni.name}
          </Title>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {uni.type && (
              <Tag color={typeColor} className="text-xs">
                {uni.type}
              </Tag>
            )}
            {uni.city?.map((c) => (
              <Tag key={c} className="text-xs">
                {c}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 mb-3">
        {uni.address && (
          <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <MapPin size={14} className="flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{uni.address}</span>
          </div>
        )}
        {uni.phone && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Phone size={14} className="flex-shrink-0" />
            <span>{uni.phone}</span>
          </div>
        )}
        {uni.website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe size={14} className="flex-shrink-0 text-gray-400" />
            <a
              href={
                uni.website.startsWith("http")
                  ? uni.website
                  : `https://${uni.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline truncate"
            >
              {uni.website}
            </a>
          </div>
        )}
      </div>

      {/* Majors */}
      {uni.universityMajors?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 size={13} className="text-gray-400" />
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Ngành đào tạo
            </Text>
          </div>
          <div className="space-y-1.5">
            {visibleMajors.map((m, i) => {
              const years = Object.entries(m.scores || {}).sort(
                ([a], [b]) => Number(b) - Number(a)
              );
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 py-1 border-b border-gray-100 dark:border-neutral-700 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1">
                      {m.name}
                    </Text>
                    <Text className="text-xs text-gray-400">{m.code}</Text>
                  </div>
                  {years.length > 0 && (
                    <Tooltip
                      title={years
                        .map(([y, s]) => `${y}: ${s}`)
                        .join(" | ")}
                    >
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-semibold text-orange-500">
                          {years[0][1]}
                        </div>
                        <div className="text-xs text-gray-400">
                          {years[0][0]}
                        </div>
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
              className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              {expanded
                ? "Thu gọn"
                : `Xem thêm ${uni.universityMajors.length - 4} ngành`}
            </button>
          )}
        </div>
      )}

      {/* Link to detail */}
      {uni.url && (
        <a
          href={uni.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
        >
          Xem trang tuyển sinh →
        </a>
      )}
    </Card>
  );
}

export default function UniversitiesClient() {
  const [cityId, setCityId] = useState(null);
  const [majorId, setMajorId] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const sidebarItems = EXPLORE_FEATURES.map((f) => ({
    key: f.key,
    href: f.href === "#" && f.key !== "universities" ? "#" : f.href,
    label: f.title,
    Icon: f.sidebarIcon,
    isExternal: false,
    onClick:
      f.href === "#" && f.key !== "universities"
        ? (e) => e.preventDefault()
        : undefined,
  }));

  const handleSearch = async () => {
    if (!cityId || !majorId) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/universities?city=${cityId}&major=${majorId}`
      );
      const data = await res.json();
      const hub = data?.verticals_university_hub?.university_hub;
      setUniversities(hub?.universityResponses ?? []);
    } catch {
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Page header */}
          <div className="mb-6">
            <Title
              level={3}
              className="!text-gray-900 dark:!text-gray-100 !mb-1"
            >
              Tìm trường Đại học - Cao đẳng
            </Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Tra cứu thông tin trường và điểm chuẩn tuyển sinh theo tỉnh thành
              và ngành học.
            </Text>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select
              placeholder="Chọn tỉnh / thành phố"
              className="flex-1"
              size="large"
              value={cityId}
              onChange={setCityId}
              showSearch
              optionFilterProp="label"
              options={CITIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
            />
            <Select
              placeholder="Chọn nhóm ngành"
              className="flex-1"
              size="large"
              value={majorId}
              onChange={setMajorId}
              showSearch
              optionFilterProp="label"
              options={MAJORS.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
            />
            <button
              onClick={handleSearch}
              disabled={!cityId || !majorId || loading}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spin size="large" />
            </div>
          ) : searched && universities.length === 0 ? (
            <Empty
              description={
                <span className="text-gray-500 dark:text-gray-400">
                  Không tìm thấy trường nào phù hợp
                </span>
              }
              className="py-16"
            />
          ) : universities.length > 0 ? (
            <>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4 block">
                Tìm thấy{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {universities.length}
                </span>{" "}
                trường
              </Text>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {universities.map((uni, i) => (
                  <UniversityCard key={uni.universityCode ?? i} uni={uni} />
                ))}
              </div>
            </>
          ) : (
            !searched && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap
                  size={48}
                  className="text-gray-300 dark:text-gray-600 mb-4"
                />
                <Text className="text-gray-400 dark:text-gray-500 text-base">
                  Chọn tỉnh thành và nhóm ngành để bắt đầu tìm kiếm
                </Text>
              </div>
            )
          )}
        </main>
      </div>
    </HomeLayout>
  );
}
