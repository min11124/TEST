import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["TODO", "DOING", "DONE"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const todo = await prisma.todo.findUnique({ where: { id } });

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(todo);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, dayOfWeek, priority, dueDate, weeklyGoalId } = body;

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  if (dayOfWeek !== undefined && (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6)) {
    return NextResponse.json({ error: "dayOfWeek must be an integer between 0 and 6" }, { status: 400 });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "status must be one of TODO, DOING, DONE" }, { status: 400 });
  }

  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: "priority must be one of LOW, MEDIUM, HIGH" }, { status: 400 });
  }

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(weeklyGoalId !== undefined && { weeklyGoalId }),
    },
  });

  return NextResponse.json(todo);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
