import HelpCenterLayout from "@/layouts/HelpCenterLayout";
import LeftSidebar from "@/components/help/LeftSidebar";

export const metadata = {
  title: "Quảng cáo trên diễn đàn - CBH Youth Online",
  description:
    "Thông tin về quảng cáo trên diễn đàn CBH Youth Online. Hướng dẫn quảng cáo, quy định nội dung và chính sách thanh toán.",
  keywords:
    "quảng cáo, CBH Youth Online, diễn đàn, quảng cáo học sinh, tiếp thị",
};

export default function AdsPage() {
  return (
    <HelpCenterLayout title="Quảng cáo">
      <LeftSidebar />
      <main className="w-full md:w-3/4 px-4">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Quảng cáo trên diễn đàn
          </h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-8">
            <div>
              <h2>Hướng dẫn quảng cáo</h2>
              <p>
                Diễn đàn của chúng tôi là một kênh hiệu quả để tiếp cận cộng
                đồng học sinh năng động. Chúng tôi cung cấp nhiều vị trí và định
                dạng quảng cáo khác nhau để phù hợp với nhu cầu của bạn. Vui
                lòng liên hệ với bộ phận kinh doanh qua email{" "}
                <a
                  href="mailto:ads@chuyenbienhoa.com"
                  className="text-blue-600 hover:underline"
                >
                  ads@chuyenbienhoa.com
                </a>{" "}
                để nhận báo giá và tư vấn chi tiết.
              </p>
            </div>
            <div>
              <h2>Quy định về nội dung quảng cáo</h2>
              <p>
                Mọi nội dung quảng cáo phải tuân thủ pháp luật Việt Nam và phù
                hợp với môi trường học đường. Chúng tôi không chấp nhận các
                quảng cáo liên quan đến rượu bia, thuốc lá, nội dung người lớn,
                cờ bạc hoặc các sản phẩm/dịch vụ bất hợp pháp. Ban quản trị có
                quyền từ chối bất kỳ quảng cáo nào không phù hợp.
              </p>
            </div>
            <div>
              <h2>Chính sách thanh toán</h2>
              <p>
                Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng và các
                ví điện tử phổ biến như MoMo, ZaloPay. Hợp đồng quảng cáo sẽ
                được kích hoạt sau khi chúng tôi xác nhận thanh toán thành công.
              </p>
            </div>
          </div>
        </div>
      </main>
    </HelpCenterLayout>
  );
}
