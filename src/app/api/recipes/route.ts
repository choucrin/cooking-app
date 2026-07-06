import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { NutritionInfo, RecipeIngredientItem } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ingredientQuery = sp.get("ingredient");
  const month = sp.get("month"); // YYYY-MM
  const date = sp.get("date"); // YYYY-MM-DD

  const where: Prisma.RecipeWhereInput = {};

  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (y && m) {
      where.cookedAt = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    }
  } else if (date) {
    const start = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      where.cookedAt = {
        gte: start,
        lt: new Date(start.getTime() + 24 * 60 * 60 * 1000),
      };
    }
  }

  let recipes = await prisma.recipe.findMany({
    where,
    orderBy: { cookedAt: "desc" },
  });

  if (ingredientQuery) {
    const q = ingredientQuery.trim().toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredientNames.some((n) => n.toLowerCase().includes(q))
    );
  }

  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, ingredients, instructions, nutrition } = body as {
    title?: string;
    ingredients?: RecipeIngredientItem[];
    instructions?: string;
    nutrition?: NutritionInfo;
  };

  if (
    !title ||
    typeof title !== "string" ||
    !Array.isArray(ingredients) ||
    !instructions ||
    typeof instructions !== "string"
  ) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      title,
      ingredients: ingredients as unknown as Prisma.InputJsonValue,
      ingredientNames: ingredients.map((i) => String(i.name)),
      instructions,
      nutrition: (nutrition ?? {}) as unknown as Prisma.InputJsonValue,
      cookedAt: new Date(),
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
