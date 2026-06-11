import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Naichii Bakery Shop",
  description: "Toko roti modern dengan pengalaman belanja visual ala TikTok Shop.",
};

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ totalSold: "desc" }, { rating: "desc" }],
    take: 8,
    include: { images: true },
  });
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] bg-white/90 p-8 shadow-card backdrop-blur-xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
              Bakery Live Shop
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Roti segar & promo cepat, pengalaman belanja visual modern.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Jelajahi produk terbaik kami, tambahkan ke keranjang instan, dan checkout dalam beberapa klik.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#best-seller" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Cari Best Seller
              </Link>
              <Link href="/admin" className="rounded-full border border-orange-500 bg-white px-6 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-50">
                Dashboard Admin
              </Link>
            </div>
          </div>
          <div className="rounded-[32px] bg-orange-500 p-8 text-white shadow-card">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                FLASH SALE HARI INI
              </div>
              <div className="rounded-3xl bg-white/15 p-6">
                <p className="text-sm uppercase tracking-[0.32em] text-orange-100">Promo kilat</p>
                <h2 className="mt-3 text-3xl font-bold">Diskon hingga 25% untuk pilihan roti premium.</h2>
                <p className="mt-4 text-sm text-orange-100/90">Checkout mudah, bayar cepat, dan nikmati rasa roti artisan langsung di rumah.</p>
              </div>
            </div>
          </div>
        </div>

        <section id="best-seller" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">Trending</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Produk Terlaris</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600">Produk populer berdasarkan rating tinggi dan penjualan terbaik, dipilih khusus untuk penikmat roti.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => {
              const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
              const isBestSeller = product.totalSold >= 50 && product.rating >= 4.5;
              const isOnSale = product.salePrice != null && product.salePrice < product.price;

              return (
                <article key={product.id} className="group overflow-hidden rounded-3xl bg-white p-4 shadow-card transition hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative overflow-hidden rounded-3xl bg-slate-100">
                    {primaryImage ? (
                      <Image src={primaryImage.imageUrl} alt={product.name} width={500} height={500} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-slate-200 text-slate-500">Tidak ada gambar</div>
                    )}
                    <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
                      {isBestSeller && <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase text-white">Best Seller</span>}
                      {isOnSale && <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase text-white">Sale</span>}
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-800">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>{product.rating.toFixed(1)}</span>
                          <span>•</span>
                          <span>{product.totalSold}+ terjual</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {isOnSale ? (
                            <>
                              <span className="text-lg font-bold text-orange-600">{formatRupiah(product.salePrice ?? product.price)}</span>
                              <span className="text-sm line-through text-slate-400">{formatRupiah(product.price)}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-slate-900">{formatRupiah(product.price)}</span>
                          )}
                        </div>
                      </div>
                      <button className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
