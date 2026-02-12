"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function ShopCard({ product }) {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.price);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden border border-neutral-100 dark:border-neutral-800">
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={product.image_url || "/images/placeholder-product.png"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs text-primary-500 font-medium mb-1 uppercase tracking-wide">
          {product.category?.name}
        </div>
        <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm line-clamp-2 mb-4 h-10">
          {product.description?.replace(/<[^>]*>?/gm, "") || "Sản phẩm chính hãng CBH Youth Online."}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-black text-neutral-900 dark:text-white">
            {formattedPrice}
          </span>
          <button
            disabled={product.stock <= 0}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 active:scale-95"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Mua ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
