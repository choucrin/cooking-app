import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { IngredientCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const ingredients = await prisma.ingredient.findMany({
    where: category ? { category: category as IngredientCategory } : undefined,
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(ingredients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, stock, canBuy } = body;

  if (!name || typeof name !== "string" || !category) {
    return NextResponse.json(
      { error: "name と category は必須です" },
      { status: 400 }
    );
  }

  const ingredient = await prisma.ingredient.create({
    data: {
      name: name.trim(),
      category,
      stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
      canBuy: Boolean(canBuy),
    },
  });
  return NextResponse.json(ingredient, { status: 201 });
}
