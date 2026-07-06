import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.category === "string") data.category = body.category;
  if (typeof body.stock === "number" && Number.isFinite(body.stock)) {
    data.stock = Math.max(0, Math.trunc(body.stock));
  }
  if (typeof body.canBuy === "boolean") data.canBuy = body.canBuy;

  const ingredient = await prisma.ingredient.update({ where: { id }, data });
  return NextResponse.json(ingredient);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.ingredient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
