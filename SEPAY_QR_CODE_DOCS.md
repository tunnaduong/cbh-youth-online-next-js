# Hướng dẫn tạo QR Code và nhúng vào website | SePay

### Ảnh QR Code là gì?

Ảnh QR Code chứa toàn bộ thông tin về ngân hàng, số tài khoản thụ hưởng, số tiền chuyển khoản, nội dung chuyển khoản.

Khi khách hàng dùng App ngân hàng để quét mã, ứng dụng sẽ tự điền toàn bộ thông tin chuyển khoản, rất tiện lợi.

Như vậy khi tích hợp QR Code, khách hàng sẽ không cần phải điền bằng tay các thông tin chuyển khoản. Trải nghiệm khách hàng sẽ tốt hơn, việc chuyển khoản thanh toán cũng nhanh hơn.

SePay cung cấp công cụ để giúp bạn tạo ảnh QR Code động tại **[qr.sepay.vn](https://qr.sepay.vn/)**.

Cấu trúc link nhúng:

https://qr.sepay.vn/img?acc=`SO_TAI_KHOAN`&bank=`NGAN_HANG`&amount=`SO_TIEN`&des=`NOI_DUNG`

Bạn chỉ cần thay thế các biến trên đường dẫn thành nội dung phù hợp.

- `SO_TAI_KHOAN` (bắt buộc): Số tài khoản ngân hàng
- `NGAN_HANG` (bắt buộc): Tên của ngân hàng (bắt buộc). Danh sách [tại đây](https://qr.sepay.vn/banks.json).
- `SO_TIEN` (không bắt buộc): Số tiền chuyển khoản.
- `NOI_DUNG` (không bắt buộc): Nội dung chuyển khoản.

**Ví dụ 1: Link QR đầy đủ thông tin số tiền và nội dung:**  
[https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=ung%20ho%20quy%20bao%20tro%20tre%20em](https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=ung%20ho%20quy%20bao%20tro%20tre%20em)

Ảnh QR Code sẽ hiển thị là

![](https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=ung%20ho%20quy%20bao%20tro%20tre%20em)

**Ví dụ 2: Link QR chỉ có thông tin số tài khoản và ngân hàng:**  
[https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank](https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank)

Ảnh QR Code sẽ hiển thị là

![](https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank)

### Nhúng mã QR Code vào website.

Bạn có thể nhúng bằng thẻ IMG như sau:

```
<img src='https://qr.sepay.vn/img?acc=SO_TAI_KHOANH&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG'/>
```
