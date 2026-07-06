import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, ANTHROPIC_MODEL } from "@/lib/anthropic";
import type { SuggestedRecipe } from "@/lib/types";

const PROPOSE_RECIPE_TOOL = {
  name: "propose_recipe",
  description: "考案した1品のレシピを提案する",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "料理名" },
      ingredients: {
        type: "array",
        description: "使用する材料と分量の一覧",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "材料名" },
            amount: { type: "string", description: "分量（例: 200g, 大さじ1）" },
          },
          required: ["name", "amount"],
        },
      },
      instructions: {
        type: "string",
        description: "具体的な調理手順。番号付きの手順がわかるように記述する",
      },
      nutrition: {
        type: "object",
        description: "1人分あたりの栄養成分の目安（数値のみ、単位はつけない）",
        properties: {
          calories: { type: "number", description: "エネルギー (kcal)" },
          protein: { type: "number", description: "たんぱく質 (g)" },
          fat: { type: "number", description: "脂質 (g)" },
          carbohydrates: { type: "number", description: "炭水化物 (g)" },
          salt: { type: "number", description: "食塩相当量 (g)" },
        },
        required: ["calories", "protein", "fat", "carbohydrates", "salt"],
      },
    },
    required: ["title", "ingredients", "instructions", "nutrition"],
  },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ingredientIds: string[] = Array.isArray(body.ingredientIds)
    ? body.ingredientIds
    : [];

  if (ingredientIds.length === 0) {
    return NextResponse.json(
      { error: "食材を1つ以上選択してください" },
      { status: 400 }
    );
  }

  const [selected, seasonings] = await Promise.all([
    prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    }),
    prisma.ingredient.findMany({
      where: { category: "SEASONING" },
    }),
  ]);

  if (selected.length === 0) {
    return NextResponse.json(
      { error: "指定された食材が見つかりません" },
      { status: 400 }
    );
  }

  const ingredientLines = selected
    .map((i) => {
      const status = i.stock > 0 ? `在庫${i.stock}` : "在庫なし（買い足し可）";
      return `- ${i.name}（${status}）`;
    })
    .join("\n");

  const seasoningLines =
    seasonings.length > 0
      ? seasonings.map((s) => `- ${s.name}`).join("\n")
      : "（登録なし）";

  const systemPrompt = `あなたは家庭料理のレシピを考案するプロの料理アシスタントです。
ユーザーが指定した食材と、家庭に常備されている調味料を使って、実際に家庭で作れる美味しいレシピを1品提案してください。

ルール:
- 指定された食材（メイン食材）は必ずしも全て使う必要はないが、できるだけ活用すること
- メイン食材リストにない食材は基本的に使わないこと（米・パン・油など、ごく一般的な主食・基礎調味料は必要であれば少量使ってよい）
- 調味料リストにあるものは自由に使ってよい
- 分量は具体的な数値（g, 個, 大さじ, 小さじなど）で示すこと
- 手順は家庭で実践できるよう、番号付きで具体的に記述すること
- 材料と分量から1人分あたりの栄養成分（エネルギー・たんぱく質・脂質・炭水化物・食塩相当量）を妥当な数値で見積もること
- 必ず propose_recipe ツールを使って構造化された形式で回答すること`;

  const userPrompt = `【メイン食材】\n${ingredientLines}\n\n【使用可能な調味料】\n${seasoningLines}\n\nこれらを使ったレシピを1つ提案してください。`;

  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [PROPOSE_RECIPE_TOOL],
      tool_choice: { type: "tool", name: "propose_recipe" },
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "propose_recipe"
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "レシピの生成に失敗しました。もう一度お試しください。" },
        { status: 502 }
      );
    }

    const recipe = toolUse.input as SuggestedRecipe;
    return NextResponse.json(recipe);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `レシピ提案に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
