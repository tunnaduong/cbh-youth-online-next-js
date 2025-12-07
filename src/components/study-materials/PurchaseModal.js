"use client";

import { Modal, message } from "antd";
import { purchaseMaterial } from "@/app/Api";

export default function PurchaseModal({ open, onClose, material, onSuccess }) {
  const handlePurchase = async () => {
    try {
      await purchaseMaterial(material.id);
      message.success("Mua tài liệu thành công!");
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || "Mua tài liệu thất bại");
    }
  };

  return (
    <Modal
      title="Xác nhận mua tài liệu"
      open={open}
      onOk={handlePurchase}
      onCancel={onClose}
      okText="Mua ngay"
      cancelText="Hủy"
    >
      <div className="space-y-4">
        <p>
          Bạn có muốn mua tài liệu <strong>{material?.title}</strong> với giá{" "}
          <strong>{material?.price} điểm</strong>?
        </p>
        <p className="text-sm text-gray-500">
          Sau khi mua, bạn có thể tải xuống và xem tài liệu này bất cứ lúc nào.
        </p>
      </div>
    </Modal>
  );
}

