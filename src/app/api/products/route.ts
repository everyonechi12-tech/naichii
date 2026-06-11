import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ totalSold: "desc" }, { rating: "desc" }],
      include: { images: true },
    });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Gagal mengambil daftar produk." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, salePrice, stock, primaryImageIndex, images } = body;

    if (!name || !description || !price || !stock || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ success: false, message: "Data produk tidak lengkap." }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock),
        images: {
          create: images.map((image: { url: string }, index: number) => ({
            imageUrl: image.url,
            isPrimary: Number(primaryImageIndex) === index,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Gagal membuat produk." }, { status: 500 });
  }
}
