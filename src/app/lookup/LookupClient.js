"use client";

import Link from "next/link";
import { Award, BookOpenCheck, ChevronRight, GraduationCap } from "lucide-react";
import LookupShell from "@/components/lookup/LookupShell";
import { HomeCard } from "@/components/home/HomeCard";

const GROUPS = [
  {
    title: "Sở GD&ĐT Ninh Bình",
    items: [
      {
        href: "/lookup/thpt",
        Icon: GraduationCap,
        title: "Thi tốt nghiệp THPT",
        desc: "Điểm thi tốt nghiệp THPT quốc gia - cần mã xác nhận",
      },
      {
        href: "/lookup/grade-10",
        Icon: Award,
        title: "Thi vào lớp 10",
        desc: "Điểm thi tuyển sinh vào 10, thứ hạng trong trường, khả năng đỗ",
      },
    ],
  },
  {
    title: "THPT Chuyên Biên Hòa",
    items: [
      {
        href: "/lookup/grades",
        Icon: BookOpenCheck,
        title: "Điểm học kỳ",
        desc: "Bảng điểm và thông tin học sinh theo năm học, học kỳ",
      },
    ],
  },
];

export default function LookupClient() {
  return (
    <LookupShell title="Tra cứu điểm thi" subtitle="Chọn kỳ thi bạn muốn tra cứu điểm.">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {group.title}
          </h2>
          <HomeCard as="div" className="overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-neutral-600">
              {group.items.map(({ href, Icon, title, desc }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-600">
                      <Icon className="h-6 w-6 text-primary-500 dark:text-[#6bcf60]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-gray-900 dark:text-neutral-100">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{desc}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </HomeCard>
        </section>
      ))}
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">
        Dữ liệu thi tốt nghiệp lấy từ cổng tra cứu của Sở GD&ĐT Ninh Bình; dữ liệu thi vào 10 lấy từ trang tra cứu
        điểm thi vào 10 Ninh Bình.
      </p>
    </LookupShell>
  );
}
