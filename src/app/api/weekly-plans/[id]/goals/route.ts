import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

const MAX_WEEKLY_GOALS = 5;

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const weeklyGoals = await prisma.weeklyGoal.findMany({
    where: { weeklyPlanId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(weeklyGoals);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { title, yearlyGoalId } = body;

  if (!title) {
    return NextResponse.json(
      { error: "title은 필수입니다." },
      { status: 400 }
    );
  }

  const weeklyPlan = await prisma.weeklyPlan.findUnique({ where: { id } });
  if (!weeklyPlan) {
    return NextResponse.json(
      { error: "해당 주간 계획을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const existingCount = await prisma.weeklyGoal.count({
    where: { weeklyPlanId: id },
  });

  if (existingCount >= MAX_WEEKLY_GOALS) {
    return NextResponse.json(
      { error: `주간 목표는 최대 ${MAX_WEEKLY_GOALS}개까지만 만들 수 있습니다.` },
      { status: 400 }
    );
  }

  const weeklyGoal = await prisma.weeklyGoal.create({
    data: {
      title,
      weeklyPlanId: id,
      yearlyGoalId: yearlyGoalId ?? null,
    },
  });

  return NextResponse.json(weeklyGoal, { status: 201 });
}
