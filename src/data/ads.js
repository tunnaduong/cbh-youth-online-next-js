// Direct-sold ad creatives (no third-party ad network). Each slot id maps to a
// list of creatives; AdSlot rotates through them. Add a paying advertiser by
// pushing an entry with `sponsor: true`; entries without it are house ads.
// Fields: id, title, description, href, image (optional), cta, sponsor,
// startsAt / endsAt (optional ISO dates, inclusive).

export const AD_SLOTS = {
  "feed-inline": [
    {
      id: "house-giftshop",
      title: "Cửa hàng quà tặng CBH",
      description: "Quà tặng, đồ lưu niệm dành riêng cho học sinh Chuyên Biên Hòa.",
      href: "https://giftshop.chuyenbienhoa.com?utm_source=cyo_feed",
      cta: "Xem cửa hàng",
    },
    {
      id: "house-advertise",
      title: "Quảng cáo tại đây",
      description: "Tiếp cận cộng đồng học sinh năng động. Liên hệ để nhận báo giá.",
      href: "/ads",
      cta: "Đặt quảng cáo",
    },
  ],
  "sidebar": [
    {
      id: "house-sidebar-advertise",
      title: "Quảng cáo tại đây",
      description: "Vị trí nổi bật bên cạnh bảng xếp hạng. Liên hệ ads@chuyenbienhoa.com.",
      href: "/ads",
      cta: "Tìm hiểu thêm",
    },
  ],
};

export function getActiveAds(slot, now = Date.now()) {
  return (AD_SLOTS[slot] || []).filter((ad) => {
    if (ad.startsAt && now < Date.parse(ad.startsAt)) return false;
    if (ad.endsAt && now > Date.parse(ad.endsAt) + 86400000) return false;
    return true;
  });
}
