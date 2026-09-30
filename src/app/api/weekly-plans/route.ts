import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const weeklyPlans = await prisma.weeklyPlan.findMany({
    include: { weeklyGoals: true },
    orderBy: { weekStartDate: "desc" },
  });
  return NextResponse.json(weeklyPlans);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { weekStartDate, weekEndDate, memo } = body;

  if (!weekStartDate || !weekEndDate) {
    return NextResponse.json(
      { error: "weekStartDate와 weekEndDate는 필수입니다." },
      { status: 400 }
    );
  }

  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
      memo: memo ?? null,
    },
    include: { weeklyGoals: true },
  });

  return NextResponse.json(weeklyPlan, { status: 201 });
}
