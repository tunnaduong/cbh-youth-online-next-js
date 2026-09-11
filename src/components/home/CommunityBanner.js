import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, PencilLine, Send } from "lucide-react";

export default function CommunityBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E9A2A] via-[#3FA836] to-[#2E9A2A] px-5 py-5 dark:from-[#1f5a1d] dark:via-[#2c7327] dark:to-[#1f5a1d] sm:px-8">
      <div className="pointer-events-none absolute inset-0 text-white/15" aria-hidden="true">
        <BookOpen className="absolute -left-2 top-2 h-12 w-12 -rotate-12" />
        <PencilLine className="absolute bottom-1 left-[18%] h-9 w-9 rotate-12" />
        <Send className="absolute right-[22%] top-2 h-8 w-8 -rotate-6" />
        <GraduationCap className="absolute -bottom-2 right-3 h-14 w-14 rotate-12" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-8 md:text-left">
        <p className="text-[15px] font-semibold text-white sm:text-base">
          Cùng xây dựng cộng đồng học sinh Chuyên Biên Hòa văn minh, tích cực và hữu ích!
        </p>
        <Link
          href="/policy/forum-rules"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary-600 shadow-sm transition hover:bg-primary-50"
        >
          Nội quy cộng đồng
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
