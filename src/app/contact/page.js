import HelpCenterLayout from "@/layouts/HelpCenterLayout";
import LeftSidebar from "@/components/help/LeftSidebar";

export const metadata = {
  title: "Liên hệ & Hỗ trợ - CBH Youth Online",
  description:
    "Thông tin liên hệ và hỗ trợ cho diễn đàn CBH Youth Online. Gửi phản hồi, báo cáo sự cố và yêu cầu hỗ trợ.",
  keywords: "liên hệ, hỗ trợ, CBH Youth Online, phản hồi, báo cáo sự cố",
};

export default function ContactPage() {
  return (
    <HelpCenterLayout title="Liên hệ">
      <LeftSidebar />
      <main className="w-full md:w-3/4 px-4">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Liên hệ & Gửi phản hồi
          </h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p>
              Chúng tôi luôn sẵn lòng lắng nghe ý kiến đóng góp và giải đáp các
              thắc mắc của bạn. Vui lòng sử dụng các thông tin dưới đây để liên
              hệ với chúng tôi.
            </p>

            <h2>Thông tin liên hệ chung</h2>
            <ul>
              <li>
                <strong>Email hỗ trợ:</strong>{" "}
                <a
                  href="mailto:hotro@chuyenbienhoa.com"
                  className="text-blue-600 hover:underline"
                >
                  hotro@chuyenbienhoa.com
                </a>
              </li>
              <li>
                <strong>Hotline:</strong> 0365520031 (Trong giờ hành chính)
              </li>
            </ul>

            <h2>Gửi phản hồi hoặc yêu cầu hỗ trợ</h2>
            <p>
              Cách tốt nhất để gửi phản hồi về tính năng, báo cáo lỗi hoặc yêu
              cầu hỗ trợ kỹ thuật là thông qua hệ thống của chúng tôi. Vui lòng
              truy cập hồ sơ của bạn và sử dụng tính năng &quot;Báo cáo sự
              cố&quot; để đội ngũ kỹ thuật có thể theo dõi và xử lý yêu cầu của
              bạn một cách hiệu quả nhất.
            </p>
            <p>
              Đối với các vấn đề khác, vui lòng gửi email đến địa chỉ hỗ trợ
              chung. Chúng tôi sẽ cố gắng phản hồi trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      </main>
    </HelpCenterLayout>
  );
}
