import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const goal = await prisma.yearlyGoal.findUnique({ where: { id } });

  if (!goal) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(goal);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, year } = body;

  const existing = await prisma.yearlyGoal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
    return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
  }
  if (year !== undefined && (typeof year !== "number" || !Number.isInteger(year))) {
    return NextResponse.json({ error: "year must be an integer" }, { status: 400 });
  }

  const goal = await prisma.yearlyGoal.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(year !== undefined ? { year } : {}),
    },
  });

  return NextResponse.json(goal);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.yearlyGoal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.yearlyGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
