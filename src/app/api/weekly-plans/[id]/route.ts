import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const weeklyPlan = await prisma.weeklyPlan.findUnique({
    where: { id },
    include: {
      weeklyGoals: { include: { todos: true } },
      todos: true,
    },
  });

  if (!weeklyPlan) {
    return NextResponse.json(
      { error: "해당 주간 계획을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json(weeklyPlan);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { weekStartDate, weekEndDate, memo, retrospective } = body;

  const existing = await prisma.weeklyPlan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "해당 주간 계획을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const weeklyPlan = await prisma.weeklyPlan.update({
    where: { id },
    data: {
      ...(weekStartDate !== undefined && {
        weekStartDate: new Date(weekStartDate),
      }),
      ...(weekEndDate !== undefined && { weekEndDate: new Date(weekEndDate) }),
      ...(memo !== undefined && { memo }),
      ...(retrospective !== undefined && { retrospective }),
    },
    include: { weeklyGoals: true },
  });

  return NextResponse.json(weeklyPlan);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await prisma.weeklyPlan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "해당 주간 계획을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.todo.deleteMany({ where: { weeklyPlanId: id } }),
    prisma.weeklyGoal.deleteMany({ where: { weeklyPlanId: id } }),
    prisma.weeklyPlan.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
