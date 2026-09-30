import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const goals = await prisma.yearlyGoal.findMany({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, year } = body;

  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (typeof year !== "number" || !Number.isInteger(year)) {
    return NextResponse.json({ error: "year must be an integer" }, { status: 400 });
  }

  const goal = await prisma.yearlyGoal.create({
    data: {
      title,
      description: typeof description === "string" ? description : null,
      year,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
