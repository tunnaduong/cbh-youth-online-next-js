/** On-page SEO overrides (Mobrilz PDF). Pages only - no API fields. */

export const SITE_LOGO_ALT = "Diễn đàn học sinh Chuyên Biên Hoà logo";

function faqBlock(items) {
  const body = items
    .map(
      ([q, a]) =>
        `<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">${q}</h3><p class="text-gray-700 dark:text-gray-300 mb-2">${a}</p>`
    )
    .join("");
  return `<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-8">Câu hỏi thường gặp</h2>${body}`;
}

const HOME_CONTENT = `
<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Trường THPT Chuyên Biên Hòa – thông tin và cộng đồng trực tuyến</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Chào mừng bạn đến với Diễn đàn học sinh Chuyên Biên Hòa (CBH Youth Online) – nơi học sinh, cựu học sinh và phụ huynh có thể tìm hiểu về <strong>trường THPT Chuyên Biên Hòa</strong>, trao đổi kinh nghiệm học tập và tham gia các hoạt động giáo dục ý nghĩa. Trang web được xây dựng bởi cộng đồng, phi lợi nhuận, nhằm kết nối các thế hệ Chuyên Biên Hòa trên không gian mạng an toàn và thân thiện.</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">THPT Chuyên Biên Hòa (tỉnh Hà Nam) là ngôi trường chuyên uy tín, nơi đào tạo nhiều thế hệ học sinh giỏi. Trên diễn đàn, bạn có thể đọc tin tức, thảo luận theo từng chuyên mục, tìm <a href="/explore/study-materials" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">tài liệu học tập</a>, tra cứu điểm, tham gia đố vui và game giải trí lành mạnh. Mọi nội dung đều hướng tới mục tiêu hỗ trợ học tập và gắn kết cộng đồng.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Chia sẻ tài liệu, kinh nghiệm ôn thi và hoạt động giáo dục</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Khu vực <a href="/forum/hoc-tap" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Góc học tập</a> tập hợp bài viết về phương pháp học, đề thi tham khảo, ebook và giáo trình do thành viên đóng góp. Bạn có thể tham khảo <a href="/forum/hoc-tap/trung-hoc-co-so" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">đề thi vào trung học phổ thông</a>, <a href="/forum/hoc-tap/trung-hoc-pho-thong" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">đề ôn thi THPT quốc gia</a>, hoặc các chuyên mục môn học như <a href="/forum/hoc-tap/van-hoc-nghe-thuat" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Văn học – Nghệ thuật</a> và <a href="/forum/hoc-tap/ebook-giao-trinh" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Ebook – Giáo trình</a>. Ngoài ra, mục <a href="/youth-news" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Tin Đoàn – Hội</a> cập nhật hoạt động ngoại khóa và sự kiện của nhà trường.</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">Các thành viên thường xuyên chia sẻ kinh nghiệm ôn thi vào lớp 10, luyện thi THPT quốc gia, chọn ngành và trường đại học. Bạn có thể đặt câu hỏi, nhận gợi ý từ anh chị khóa trên và cựu học sinh. Hệ thống bình luận và tìm kiếm giúp bạn nhanh chóng tìm lại chủ đề quan tâm.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kết nối học sinh, cựu học sinh và cộng đồng Chuyên Biên Hòa</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Diễn đàn <a href="/forum/giao-luu" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Giao lưu</a> là không gian trò chuyện, tâm sự và gắn kết. Chuyên mục <a href="/forum/giao-luu/cuu-hoc-sinh" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Cựu học sinh</a> giúp các thế hệ duy trì liên lạc, chia sẻ định hướng nghề nghiệp và hỗ trợ em học sinh hiện tại. Bạn cũng có thể xem <a href="/users/ranking" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">bảng xếp hạng thành viên</a>, tham gia chat công khai trên trang chủ hoặc nhắn tin riêng khi đã đăng nhập.</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">Chúng tôi khuyến khích nội dung tích cực, tôn trọng quy tắc cộng đồng. Vui lòng đọc <a href="/policy/forum-rules" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Quy tắc diễn đàn</a>, <a href="/policy/privacy" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Chính sách bảo mật</a> và <a href="/help" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Trung tâm trợ giúp</a> trước khi đăng bài. Nếu cần hỗ trợ kỹ thuật hoặc góp ý, hãy dùng trang <a href="/contact" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Liên hệ</a> hoặc <a href="/feedback" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Góp ý &amp; báo lỗi</a>.</p>
<p class="text-gray-700 dark:text-gray-300 mb-4">CBH Youth Online không thuộc quản lý trực tiếp của nhà trường nhưng luôn đặt tinh thần học tập và văn hóa Chuyên Biên Hòa lên hàng đầu. Hãy tạo tài khoản miễn phí, theo dõi các chuyên mục yêu thích và đóng góp bài viết, tài liệu hữu ích cho cộng đồng. Mỗi chia sẻ nhỏ đều góp phần làm phong phú kho tri thức chung và lan tỏa giá trị giáo dục của trường THPT Chuyên Biên Hòa.</p>
${faqBlock([
  [
    "Diễn đàn học sinh Chuyên Biên Hòa dùng để làm gì?",
    "Đây là cộng đồng trực tuyến để học sinh và cựu học sinh trao đổi học tập, chia sẻ tài liệu, cập nhật hoạt động và kết nối với nhau.",
  ],
  [
    "Tôi có thể tìm tài liệu ôn thi ở đâu?",
    "Vào mục Góc học tập, Chợ tài liệu (/explore/study-materials) hoặc các chuyên mục con như THCS, THPT, Ebook – Giáo trình.",
  ],
  [
    "Tham gia diễn đàn có mất phí không?",
    "Không. Đăng ký và sử dụng các tính năng cơ bản đều miễn phí; trang web hoạt động phi lợi nhuận.",
  ],
  [
    "Làm sao liên hệ ban quản trị?",
    "Dùng trang Liên hệ, Góp ý &amp; báo lỗi hoặc xem hướng dẫn trong Trung tâm trợ giúp.",
  ],
])}
`;

/** @type {Record<string, { metaTitle: string, metaDescription: string, h1?: string, contentHtml: string }>} */
export const ON_PAGE_SEO = {
  "/": {
    metaTitle: "Trường THPT Chuyên Biên Hòa – Thông Tin & Cộng Đồng Học Sinh",
    metaDescription:
      "Tìm hiểu thông tin về trường THPT Chuyên Biên Hòa, chia sẻ tài liệu học tập, kinh nghiệm ôn thi, hoạt động giáo dục và kết nối học sinh, cựu học sinh.",
    contentHtml: HOME_CONTENT,
  },
  "/forum/giao-luu": {
    metaTitle:
      "Cộng Đồng Học Sinh Chuyên Biên Hòa – Diễn Đàn Học Sinh THPT Chuyên",
    metaDescription:
      "Khám phá cộng đồng học sinh Chuyên Biên Hòa, nơi kết nối học sinh, cựu học sinh và chia sẻ tài liệu, kinh nghiệm học tập, ôn thi và thông tin giáo dục.",
    h1: "Cộng Đồng Học Sinh Chuyên Biên Hòa",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Diễn Đàn Học Sinh THPT Chuyên</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Chuyên mục Giao lưu là trung tâm kết nối của cộng đồng học sinh Chuyên Biên Hòa. Tại đây, bạn có thể trò chuyện, chia sẻ cảm xúc và xây dựng mối quan hệ bền vững với bạn bè cùng trường và các anh chị khóa trên.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Chia Sẻ Tài Liệu Và Kinh Nghiệm Học Tập</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Liên kết nội bộ tới <a href="/forum/hoc-tap" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Góc học tập</a> và <a href="/explore/study-materials" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Chợ tài liệu</a> giúp bạn nhanh chóng tìm đề thi, bài giảng và mẹo ôn tập.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Tài Liệu Học Tập Hữu Ích</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Thành viên thường xuyên đăng tài liệu PDF, slide và ghi chú theo từng môn học.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Kinh Nghiệm Ôn Thi</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Trao đổi lộ trình ôn thi vào lớp 10, THPT quốc gia và các kỳ thi học sinh giỏi.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kết Nối Học Sinh Và Cựu Học Sinh</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Ghé <a href="/forum/giao-luu/cuu-hoc-sinh" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Cựu học sinh</a> để gặp gỡ các thế hệ trước và nhận tư vấn định hướng.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Thảo Luận Và Giao Lưu Cộng Đồng</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Các box con như ký túc xá, góc tâm sự và tìm đồ thất lạc tạo không gian thân thiện cho mọi thành viên.</p>
${faqBlock([
  [
    "Giao lưu khác Góc học tập như thế nào?",
    "Giao lưu tập trung vào kết nối cộng đồng và trò chuyện; Góc học tập ưu tiên nội dung học thuật và tài liệu.",
  ],
  [
    "Ai có thể đăng bài trong chuyên mục này?",
    "Thành viên đã đăng ký tài khoản và tuân thủ quy tắc diễn đàn.",
  ],
  [
    "Làm sao tìm bài viết cũ?",
    "Dùng ô tìm kiếm trên trang web hoặc duyệt từng chuyên mục con trong Giao lưu.",
  ],
])}
`,
  },
  "/forum/giao-luu/cuu-hoc-sinh": {
    metaTitle: "Diễn đàn sinh viên – Kết Nối & Chia Sẻ Kiến Thức",
    metaDescription:
      "Tham gia Diễn đàn học sinh Chuyên Biên Hoà để kết nối sinh viên, chia sẻ kiến thức, tài liệu học tập, kinh nghiệm học tập và thông tin giáo dục hữu ích.",
    h1: "Diễn đàn sinh viên – Kết nối và chia sẻ kiến thức",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Cộng đồng sinh viên học tập và giao lưu</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Nơi cựu học sinh Chuyên Biên Hòa đang theo học đại học, cao đẳng gặp gỡ, trao đổi và duy trì tinh thần alma mater.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Chia sẻ tài liệu học tập và kinh nghiệm</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Xem thêm <a href="/forum/hoc-tap/ebook-giao-trinh" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Ebook – Giáo trình</a> và <a href="/explore/universities" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Tìm trường ĐH-CĐ</a>.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Cập nhật thông tin giáo dục hữu ích</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Tin tức học bổng, chương trình trao đổi và cơ hội thực tập được thành viên cập nhật thường xuyên.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kết nối sinh viên và cựu học sinh</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Quay lại <a href="/forum/giao-luu" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Giao lưu</a> để tham gia các chủ đề rộng hơn của cộng đồng.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Phương pháp học tập hiệu quả</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Anh chị chia sẻ cách quản lý thời gian, ghi chép và ôn thi ở bậc đại học.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Trao đổi kiến thức và kinh nghiệm học tập</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Thảo luận mở giúp em học sinh THPT định hướng ngành học phù hợp.</p>
${faqBlock([
  [
    "Chuyên mục này dành cho ai?",
    "Cựu học sinh, sinh viên và học sinh muốn tìm hiểu đời sống sau khi rời trường.",
  ],
  [
    "Có thể đăng tin tuyển dụng hoặc học bổng không?",
    "Có, nếu nội dung phù hợp quy tắc cộng đồng và không vi phạm spam.",
  ],
])}
`,
  },
  "/forum/hoc-tap/trung-hoc-co-so": {
    metaTitle: "Đề Thi Vào Trung Học Phổ Thông – Tài Liệu Ôn Thi",
    metaDescription:
      "Diễn đàn học sinh Chuyên Biên Hoà chia sẻ đề thi vào trung học phổ thông, đề thi tham khảo, tài liệu ôn tập và kinh nghiệm làm bài, giúp học sinh chuẩn bị tốt cho kỳ thi tuyển sinh lớp 10.",
    h1: "Đề Thi Vào Trung Học Phổ Thông",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Tổng Hợp Đề Thi Tham Khảo Vào Lớp 10</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Thành viên đăng đề thi các năm, đề luyện và hướng dẫn chấm điểm theo từng môn.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Tài Liệu Và Kiến Thức Ôn Thi Hữu Ích</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Kết hợp với <a href="/forum/hoc-tap/ebook-giao-trinh" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Ebook – Giáo trình</a> và <a href="/explore/study-materials" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Chợ tài liệu</a>.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kinh Nghiệm Ôn Tập Hiệu Quả</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Chia sẻ lịch ôn, dạng bài thường gặp và cách quản lý áp lực trước kỳ thi tuyển sinh.</p>
${faqBlock([
  [
    "Đề thi trên diễn đàn có chính thức không?",
    "Phần lớn là đề tham khảo do cộng đồng chia sẻ; hãy đối chiếu với nguồn nhà trường hoặc Sở GD&amp;ĐT.",
  ],
  [
    "Học sinh lớp 9 có thể hỏi bài không?",
    "Có, bạn có thể đặt câu hỏi và nhận gợi ý từ anh chị đã thi vào trường chuyên.",
  ],
])}
`,
  },
  "/forum/hoc-tap/trung-hoc-pho-thong": {
    metaTitle: "Đề Ôn Thi THPT Quốc Gia – Tài Liệu & Kinh Nghiệm Học Tập",
    metaDescription:
      "Khám phá đề ôn thi THPT quốc gia cùng Diễn đàn học sinh Chuyên Biên Hoà. Tham khảo đề thi, kiến thức trọng tâm, tài liệu học tập và kinh nghiệm ôn luyện hiệu quả.",
    h1: "Đề Ôn Thi THPT Quốc Gia Mới Nhất",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Tổng Hợp Đề Ôn Thi THPT Quốc Gia</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Cập nhật đề thi thử, đề minh họa và bộ đề luyện theo từng môn thi.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Tài Liệu Ôn Thi Và Đề Thi Tham Khảo</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Xem thêm <a href="/forum/hoc-tap/van-hoc-nghe-thuat" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">môn Văn</a> và các chuyên mục môn học khác trong <a href="/forum/hoc-tap" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Góc học tập</a>.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Phương Pháp Ôn Thi THPT Quốc Gia Hiệu Quả</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Lên kế hoạch ôn theo giai đoạn, luyện đề có thời gian và rút kinh nghiệm sau mỗi lần thi thử.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kinh Nghiệm Ôn Thi Từ Cộng Đồng Học Sinh</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Các bài viết từ cựu thí sinh đạt điểm cao được ghim và chia sẻ lại thường xuyên.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Đề Ôn Tập Theo Từng Môn Học</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa… mỗi môn có tag và chủ đề riêng.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Chia Sẻ Kiến Thức Cùng Diễn đàn học sinh Chuyên Biên Hoà</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Đặt câu hỏi, bình luận và lưu bài để ôn lại khi cần.</p>
${faqBlock([
  [
    "Đề ôn thi có được cập nhật theo năm không?",
    "Thành viên thường đăng đề mới mỗi năm học; hãy kiểm tra năm thi trên từng bài viết.",
  ],
  [
    "Có tài liệu cho tổ hợp môn xét tuyển không?",
    "Có nhiều bài viết về tổ hợp và cách chọn môn thi phù hợp nguyện vọng.",
  ],
])}
`,
  },
  "/forum/hoc-tap/van-hoc-nghe-thuat": {
    metaTitle: "Đề Ôn Thi THPT Quốc Gia Môn Văn – Chuyên Biên Hoà",
    metaDescription:
      "Khám phá đề ôn thi THPT quốc gia môn Văn, đề thi tham khảo, kiến thức trọng tâm và phương pháp ôn tập hiệu quả tại Diễn đàn học sinh Chuyên Biên Hoà.",
    h1: "Đề Ôn Thi THPT Quốc Gia Môn Văn",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Tổng Hợp Đề Thi Tham Khảo Môn Ngữ Văn</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Đề thi thử, đề minh họa và bài nghị luận mẫu do giáo viên và học sinh đóng góp.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kiến Thức Trọng Tâm Ôn Thi THPT Quốc Gia Môn Văn</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Tác phẩm, thể loại, nghị luận xã hội và nghị luận văn học được hệ thống theo chương trình lớp 12.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Phương Pháp Ôn Tập Và Làm Bài Văn Hiệu Quả</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Luyện dàn ý, mở bài kết bài và quản lý thời gian trong phòng thi.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Chia Sẻ Kinh Nghiệm Ôn Thi Cùng Diễn Đàn Học Sinh Chuyên Biên Hoà</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Tham khảo thêm <a href="/forum/hoc-tap/trung-hoc-pho-thong" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">THPT</a> cho đề tổng hợp các môn.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Cách Phân Tích Đề Và Lập Dàn Ý</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Hướng dẫn đọc đề, xác định yêu cầu và xây dựng luận điểm rõ ràng.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Bí Quyết Nâng Cao Kỹ Năng Đọc Hiểu Và Nghị Luận Văn Học</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Chia sẻ cách trích dẫn, phân tích nghệ thuật và liên hệ thực tiễn.</p>
${faqBlock([
  [
    "Chuyên mục Văn học – Nghệ thuật có chỉ mỗi đề thi không?",
    "Không - ngoài đề thi còn có thơ, truyện, hội họa và góc sáng tạo của học sinh.",
  ],
  [
    "Làm sao tìm đề môn Văn nhanh nhất?",
    "Dùng tìm kiếm với từ khóa \"đề Văn THPT\" hoặc lọc bài trong chuyên mục này.",
  ],
])}
`,
  },
  "/forum/hoc-tap/ebook-giao-trinh": {
    metaTitle: "Tài Liệu Học Tập Chuyên Biên Hòa | Tài Liệu Ôn Tập",
    metaDescription:
      "Tổng hợp tài liệu học tập Chuyên Biên Hòa, hỗ trợ học sinh ôn tập kiến thức, luyện đề, tham khảo bài tập và chuẩn bị tốt cho các kỳ kiểm tra, thi cử.",
    h1: "Tài Liệu Học Tập Chuyên Biên Hòa",
    contentHtml: `
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-2">Tổng Hợp Tài Liệu Học Tập Và Đề Thi Tham Khảo</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Ebook, slide, sách PDF và giáo trình được chia sẻ miễn phí trong giới hạn bản quyền.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Kiến Thức Trọng Tâm Và Tài Liệu Ôn Tập</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Liên kết <a href="/explore/study-materials" class="text-primary-500 hover:text-primary-600 dark:text-[#6bcf60]">Chợ tài liệu</a> để tải file có hệ thống hơn.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Phương Pháp Học Tập Và Ôn Thi Hiệu Quả</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Gợi ý cách ghi chú, ôn theo chủ đề và kết hợp luyện đề.</p>
<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">Chia Sẻ Tài Liệu Cùng Diễn Đàn Học Sinh Chuyên Biên Hoà</h2>
<p class="text-gray-700 dark:text-gray-300 mb-4">Đăng bài kèm mô tả rõ nguồn và mục đích sử dụng để mọi người dễ tìm.</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Tài Liệu Tham Khảo Cho Các Môn Học</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Phân loại theo lớp, môn và loại file (PDF, Word, video).</p>
<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">Kinh Nghiệm Tìm Kiếm Và Sử Dụng Tài Liệu Học Tập</h3>
<p class="text-gray-700 dark:text-gray-300 mb-4">Đánh giá chất lượng tài liệu và tránh phụ thuộc vào một nguồn duy nhất.</p>
${faqBlock([
  [
    "Tải tài liệu có cần đăng nhập không?",
    "Một số bài yêu cầu đăng nhập; Chợ tài liệu có thể có quy tắc riêng cho từng file.",
  ],
  [
    "Tôi có thể đăng ebook của mình không?",
    "Có, nếu bạn sở hữu bản quyền hoặc được phép chia sẻ.",
  ],
])}
`,
  },
};

/**
 * @param {string} path - e.g. "/forum/giao-luu/cuu-hoc-sinh"
 */
export function getOnPageSeo(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutTrailing = normalized.replace(/\/$/, "") || "/";
  return ON_PAGE_SEO[withoutTrailing] ?? null;
}
