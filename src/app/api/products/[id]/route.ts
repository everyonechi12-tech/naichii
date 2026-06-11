import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const productId = params.id;
    const { name, description, price, salePrice, stock, primaryImageIndex, images } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan." }, { status: 404 });
    }

    const updateData: any = {
      name: name?.trim() ?? existingProduct.name,
      description: description?.trim() ?? existingProduct.description,
      price: price ? Number(price) : existingProduct.price,
      salePrice: salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : existingProduct.salePrice,
      stock: stock ? Number(stock) : existingProduct.stock,
    };

    if (Array.isArray(images) && images.length > 0) {
      updateData.images = {
        deleteMany: {},
        create: images.map((image: { url: string }, index: number) => ({
          imageUrl: image.url,
          isPrimary: Number(primaryImageIndex) === index,
        })),
      };
    } else if (primaryImageIndex !== undefined) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
      const newPrimary = existingProduct.images[Number(primaryImageIndex)];
      if (newPrimary) {
        await prisma.productImage.update({
          where: { id: newPrimary.id },
          data: { isPrimary: true },
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { images: true },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui produk." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true, message: "Produk berhasil dihapus." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Gagal menghapus produk." }, { status: 500 });
  }
}
