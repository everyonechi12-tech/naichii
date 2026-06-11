import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error("Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

interface ProductPayload {
  name: string;
  description: string;
  price: string;
  salePrice?: string;
  stock: string;
  rating?: string;
  totalSold?: string;
  primaryImageIndex: string;
}

const validateProductData = (body: any, files: Express.Multer.File[]) => {
  const errors: string[] = [];
  const { name, description, price, stock, primaryImageIndex } = body;

  if (!name || !name.trim()) errors.push("Nama produk wajib diisi.");
  if (!description || !description.trim()) errors.push("Deskripsi produk wajib diisi.");
  if (!price || Number.isNaN(Number(price)) || Number(price) < 0) errors.push("Harga produk tidak valid.");
  if (!stock || Number.isNaN(Number(stock)) || Number(stock) < 0) errors.push("Stok produk tidak valid.");
  if (!files || files.length === 0) errors.push("Minimal satu gambar produk wajib diunggah.");
  if (!primaryImageIndex || Number.isNaN(Number(primaryImageIndex))) errors.push("Indeks gambar utama harus valid.");
  if (files && primaryImageIndex !== undefined) {
    const index = Number(primaryImageIndex);
    if (index < 0 || index >= files.length) {
      errors.push("Gambar utama tidak valid. Pilih satu gambar dalam daftar upload.");
    }
  }
  return errors;
};

router.post("/products", upload.array("images", 6), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const errors = validateProductData(req.body, files);
    if (errors.length) {
      files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({ success: false, errors });
    }

    const product = await prisma.product.create({
      data: {
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        price: Number(req.body.price),
        salePrice: req.body.salePrice ? Number(req.body.salePrice) : null,
        stock: Number(req.body.stock),
        rating: req.body.rating ? Number(req.body.rating) : 0,
        totalSold: req.body.totalSold ? Number(req.body.totalSold) : 0,
        images: {
          create: files.map((file, index) => ({
            imageUrl: `/uploads/${path.basename(file.path)}`,
            isPrimary: Number(req.body.primaryImageIndex) === index,
          })),
        },
      },
      include: { images: true },
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Gagal membuat produk. Coba lagi nanti." });
  }
});

router.put("/products/:id", upload.array("images", 6), async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files as Express.Multer.File[];

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!existingProduct) {
      files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(404).json({ success: false, message: "Produk tidak ditemukan." });
    }

    const updateData: any = {
      name: req.body.name?.trim() ?? existingProduct.name,
      description: req.body.description?.trim() ?? existingProduct.description,
      price: req.body.price ? Number(req.body.price) : existingProduct.price,
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : existingProduct.salePrice,
      stock: req.body.stock ? Number(req.body.stock) : existingProduct.stock,
      rating: req.body.rating ? Number(req.body.rating) : existingProduct.rating,
      totalSold: req.body.totalSold ? Number(req.body.totalSold) : existingProduct.totalSold,
    };

    if (files.length > 0) {
      const errors = validateProductData({
        ...req.body,
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        stock: updateData.stock,
      }, files);

      if (errors.length) {
        files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({ success: false, errors });
      }

      await prisma.productImage.deleteMany({ where: { productId } });
      updateData.images = {
        create: files.map((file, index) => ({
          imageUrl: `/uploads/${path.basename(file.path)}`,
          isPrimary: Number(req.body.primaryImageIndex) === index,
        })),
      };
    }

    if (req.body.primaryImageIndex !== undefined && files.length === 0) {
      const primaryIndex = Number(req.body.primaryImageIndex);
      if (Number.isNaN(primaryIndex) || primaryIndex < 0 || primaryIndex >= existingProduct.images.length) {
        return res.status(400).json({ success: false, message: "Indeks gambar utama tidak valid." });
      }

      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });

      const primaryImage = existingProduct.images[primaryIndex];
      if (primaryImage) {
        await prisma.productImage.update({
          where: { id: primaryImage.id },
          data: { isPrimary: true },
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { images: true },
    });

    return res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Gagal memperbarui produk. Coba lagi nanti." });
  }
});

export default router;
