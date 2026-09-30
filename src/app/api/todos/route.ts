import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const weeklyPlanId = request.nextUrl.searchParams.get("weeklyPlanId");

  const todos = await prisma.todo.findMany({
    where: weeklyPlanId ? { weeklyPlanId } : undefined,
    orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, weeklyPlanId, weeklyGoalId, dayOfWeek, priority, dueDate } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!weeklyPlanId || typeof weeklyPlanId !== "string") {
    return NextResponse.json({ error: "weeklyPlanId is required" }, { status: 400 });
  }

  if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "dayOfWeek must be an integer between 0 and 6" }, { status: 400 });
  }

  if (priority !== undefined && priority !== null && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    return NextResponse.json({ error: "priority must be one of LOW, MEDIUM, HIGH" }, { status: 400 });
  }

  const todo = await prisma.todo.create({
    data: {
      title,
      description: description ?? undefined,
      weeklyPlanId,
      weeklyGoalId: weeklyGoalId ?? undefined,
      dayOfWeek,
      priority: priority ?? undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
