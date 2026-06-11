"use client";

import { useMemo, useState } from "react";

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  primaryImageIndex: number;
}

interface PreviewImage {
  file: File;
  previewUrl: string;
}

const initialState: ProductFormState = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  stock: "",
  primaryImageIndex: 0,
};

export default function AdminPage() {
  const [form, setForm] = useState<ProductFormState>(initialState);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewList = useMemo(
    () => images.map((image, index) => ({ ...image, index })),
    [images]
  );

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const selected = Array.from(files);
    const invalidFile = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (invalidFile) {
      setError("Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.");
      return;
    }

    const previews = selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages(previews);
    setForm((prev) => ({ ...prev, primaryImageIndex: 0 }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.description.trim() || !form.price.trim() || !form.stock.trim()) {
      setError("Nama, deskripsi, harga, dan stok harus diisi.");
      return;
    }

    if (images.length === 0) {
      setError("Unggah minimal satu gambar produk.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("salePrice", form.salePrice);
    formData.append("stock", form.stock);
    formData.append("primaryImageIndex", String(form.primaryImageIndex));
    images.forEach((image) => formData.append("images", image.file));

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.errors ? result.errors.join(" ") : result.message || "Gagal menyimpan produk.");
        return;
      }

      setSuccess("Produk berhasil dibuat.");
      setForm(initialState);
      setImages([]);
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan produk. Mohon coba lagi.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[32px] bg-white p-8 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Admin Dashboard</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Kelola Produk Bakery</h1>
          <p className="mt-3 text-slate-600">Tambah produk baru, unggah gambar, dan pilih gambar utama agar tampilan selalu konsisten.</p>
        </header>

        <section className="rounded-[32px] bg-white p-8 shadow-card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Nama Produk
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:border-orange-500 focus:ring"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Harga (Rp)
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:border-orange-500 focus:ring"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Diskon Harga (Opsional)
                <input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => handleInputChange("salePrice", e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:border-orange-500 focus:ring"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Stok
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:border-orange-500 focus:ring"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Deskripsi Produk
              <textarea
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={5}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-orange-200 transition focus:border-orange-500 focus:ring"
              />
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Upload Gambar Produk</p>
                  <p className="text-sm text-slate-500">JPG, PNG, WEBP maksimal 5MB. Pilih satu gambar utama.</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="text-sm text-slate-500"
                />
              </div>

              {images.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-900">Preview Gambar</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {previewList.map((image) => (
                      <button
                        key={image.index}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, primaryImageIndex: image.index }))}
                        className={`group overflow-hidden rounded-3xl border p-1 outline-none transition ${
                          form.primaryImageIndex === image.index ? "border-orange-500" : "border-slate-200"
                        }`}
                      >
                        <img src={image.previewUrl} alt={`Preview ${image.index + 1}`} className="h-40 w-full object-cover" />
                        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                          <span>Gambar {image.index + 1}</span>
                          {form.primaryImageIndex === image.index && <span className="rounded-full bg-orange-500 px-2 py-1 text-white">Utama</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Simpan Produk
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
