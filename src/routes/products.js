import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../prismaClient.js";

const router = express.Router();

const uploadFolder = path.resolve("./public/uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadFolder),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const requireProductFields = (body, files) => {
  const errors = [];
  if (!body.name || !body.name.trim()) errors.push("Nama produk wajib diisi.");
  if (!body.description || !body.description.trim()) errors.push("Deskripsi produk wajib diisi.");
  if (!body.price || Number.isNaN(Number(body.price)) || Number(body.price) < 0) {
    errors.push("Harga produk harus berupa angka positif.");
  }
  if (!body.stock || Number.isNaN(Number(body.stock)) || Number(body.stock) < 0) {
    errors.push("Stok produk harus berupa angka positif.");
  }
  if (!files || files.length === 0) {
    errors.push("Setidaknya satu gambar produk harus diunggah.");
  }
  return errors;
};

const buildImageUrl = (filename) => `/uploads/${filename}`;

router.post("/products", upload.array("images", 10), async (req, res) => {
  try {
    const files = req.files;
    const errors = requireProductFields(req.body, files);
    if (errors.length) return res.status(400).json({ errors });

    const price = Number(req.body.price);
    const salePrice = req.body.salePrice ? Number(req.body.salePrice) : null;
    const stock = Number(req.body.stock);
    const primaryIndex = Number(req.body.primaryIndex ?? 0);
    const slug = req.body.slug ?? req.body.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (primaryIndex < 0 || primaryIndex >= files.length) {
      return res.status(400).json({ error: "Indeks gambar utama tidak valid." });
    }

    const imagesData = files.map((file, index) => ({
      imageUrl: buildImageUrl(file.filename),
      isPrimary: index === primaryIndex,
    }));

    const createdProduct = await prisma.product.create({
      data: {
        name: req.body.name,
        slug,
        description: req.body.description,
        price,
        salePrice,
        stock,
        rating: Number(req.body.rating ?? 0),
        totalSold: Number(req.body.totalSold ?? 0),
      },
    });

    const createdImages = await Promise.all(
      imagesData.map((image) =>
        prisma.productImage.create({
          data: {
            productId: createdProduct.id,
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary,
          },
        })
      )
    );

    const primaryImage = createdImages.find((image) => image.isPrimary) ?? createdImages[0];

    await prisma.product.update({
      where: { id: createdProduct.id },
      data: { primaryImageId: primaryImage.id },
    });

    const productWithImages = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: { images: true, primaryImage: true },
    });

    return res.status(201).json(productWithImages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal membuat produk. Silakan coba lagi." });
  }
});

router.put("/products/:id", upload.array("images", 10), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ error: "ID produk tidak valid." });
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    const files = req.files || [];
    const price = req.body.price !== undefined ? Number(req.body.price) : undefined;
    const salePrice = req.body.salePrice !== undefined ? Number(req.body.salePrice) : undefined;
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : undefined;
    const primaryImageId = req.body.primaryImageId ? Number(req.body.primaryImageId) : undefined;
    const deleteImageIds = req.body.deleteImageIds ? JSON.parse(req.body.deleteImageIds) : [];

    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({ error: "Nama produk tidak boleh kosong." });
    }
    if (req.body.description !== undefined && !req.body.description.trim()) {
      return res.status(400).json({ error: "Deskripsi produk tidak boleh kosong." });
    }
    if (price !== undefined && (Number.isNaN(price) || price < 0)) {
      return res.status(400).json({ error: "Harga produk harus berupa angka positif." });
    }
    if (stock !== undefined && (Number.isNaN(stock) || stock < 0)) {
      return res.status(400).json({ error: "Stok produk harus berupa angka positif." });
    }

    const createImages = await Promise.all(
      files.map((file) =>
        prisma.productImage.create({
          data: {
            productId,
            imageUrl: buildImageUrl(file.filename),
            isPrimary: false,
          },
        })
      )
    );

    if (Array.isArray(deleteImageIds) && deleteImageIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: deleteImageIds }, productId },
      });
    }

    const updatedData = {
      name: req.body.name?.trim(),
      slug: req.body.slug?.trim(),
      description: req.body.description?.trim(),
      price,
      salePrice,
      stock,
      rating: req.body.rating !== undefined ? Number(req.body.rating) : undefined,
      totalSold: req.body.totalSold !== undefined ? Number(req.body.totalSold) : undefined,
    };

    const cleanedData = Object.fromEntries(
      Object.entries(updatedData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(cleanedData).length) {
      await prisma.product.update({ where: { id: productId }, data: cleanedData });
    }

    if (primaryImageId) {
      const primaryImage = await prisma.productImage.findFirst({
        where: { id: primaryImageId, productId },
      });
      if (!primaryImage) {
        return res.status(400).json({ error: "Gambar utama tidak valid untuk produk ini." });
      }
      await prisma.product.update({
        where: { id: productId },
        data: { primaryImageId },
      });
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
      await prisma.productImage.update({
        where: { id: primaryImageId },
        data: { isPrimary: true },
      });
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true, primaryImage: true },
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal memperbarui produk. Silakan coba lagi." });
  }
});

export default router;
