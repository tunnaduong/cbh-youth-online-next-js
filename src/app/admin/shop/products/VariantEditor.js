"use client";

import { Button, Input, InputNumber, Select, Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { fmtNumber, vndToPoints } from "../../_components/ResourceTable";
import ImageUploadInput from "../../_components/ImageUploadInput";

const MAX_OPTIONS = 3;

// Stable key for a variant's option combination, independent of object key order.
const comboKey = (options, combo) => options.map((o) => `${o.name}=${combo[o.name] ?? ""}`).join("|");

// All combinations of the option values, e.g. Size×Màu → [{Size:"S",Màu:"Đen"}, ...]
const cartesian = (options) =>
  options.reduce(
    (acc, o) => acc.flatMap((combo) => o.values.map((v) => ({ ...combo, [o.name]: v }))),
    [{}],
  );

/**
 * Shopee-style variant editor: up to 3 option groups (Size, Màu, ...) and one row per
 * combination with its own price / stock / SKU / image.
 */
export default function VariantEditor({ value, onChange, basePrice = 0 }) {
  const options = value?.options || [];
  const variants = value?.variants || [];

  // Rebuild the variant rows from the option groups, keeping data of combos that still exist.
  const emit = (nextOptions) => {
    const valid = nextOptions.filter((o) => o.name.trim() && o.values.length);
    const existing = new Map(variants.map((v) => [comboKey(valid, v.options), v]));
    const nextVariants = valid.length
      ? cartesian(valid).map(
          (combo) =>
            existing.get(comboKey(valid, combo)) || {
              options: combo,
              price: basePrice,
              stock: 0,
              sku: "",
              image_url: "",
            },
        )
      : [];
    onChange({ options: nextOptions, variants: nextVariants });
  };

  const setOption = (i, patch) => emit(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const setVariant = (i, patch) =>
    onChange({ options, variants: variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });

  const validOptions = options.filter((o) => o.name.trim() && o.values.length);

  const columns = [
    ...validOptions.map((o) => ({
      title: o.name,
      key: `opt-${o.name}`,
      render: (_, v) => v.options[o.name],
    })),
    {
      title: "Giá (VND)",
      key: "price",
      width: 150,
      render: (_, v, i) => (
        <div>
          <InputNumber
            min={0}
            step={1000}
            size="small"
            className="!w-full"
            value={v.price}
            onChange={(price) => setVariant(i, { price: price ?? 0 })}
          />
          <div className="text-[11px] text-gray-400">≈ {fmtNumber(vndToPoints(v.price || 0))} điểm</div>
        </div>
      ),
    },
    {
      title: "Kho",
      key: "stock",
      width: 90,
      render: (_, v, i) => (
        <InputNumber
          min={0}
          size="small"
          className="!w-full"
          value={v.stock}
          onChange={(stock) => setVariant(i, { stock: stock ?? 0 })}
        />
      ),
    },
    {
      title: "Mã SKU",
      key: "sku",
      width: 130,
      render: (_, v, i) => (
        <Input size="small" maxLength={64} value={v.sku || ""} onChange={(e) => setVariant(i, { sku: e.target.value })} />
      ),
    },
    {
      title: "Ảnh",
      key: "image_url",
      width: 120,
      render: (_, v, i) => (
        <ImageUploadInput compact size="small" value={v.image_url} onChange={(image_url) => setVariant(i, { image_url })} />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {options.map((o, i) => (
        <div key={i} className="rounded border border-gray-200 p-3 bg-gray-50">
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Tên phân loại (VD: Size, Màu)"
              value={o.name}
              maxLength={50}
              onChange={(e) => setOption(i, { name: e.target.value })}
            />
            <Button icon={<DeleteOutlined />} danger onClick={() => emit(options.filter((_, idx) => idx !== i))} />
          </div>
          <Select
            mode="tags"
            className="w-full"
            placeholder="Nhập giá trị rồi Enter (VD: S, M, L)"
            value={o.values}
            tokenSeparators={[","]}
            open={false}
            onChange={(values) => setOption(i, { values: [...new Set(values.map((v) => v.trim()).filter(Boolean))] })}
          />
        </div>
      ))}
      {options.length < MAX_OPTIONS && (
        <Button icon={<PlusOutlined />} onClick={() => emit([...options, { name: "", values: [] }])}>
          Thêm nhóm phân loại
        </Button>
      )}
      {variants.length > 0 && (
        <Table
          size="small"
          rowKey={(v) => comboKey(validOptions, v.options)}
          columns={columns}
          dataSource={variants}
          pagination={false}
          scroll={{ x: true }}
        />
      )}
    </div>
  );
}
