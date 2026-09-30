"use client";

import { useEffect, useState } from "react";

type YearlyGoal = {
  id: string;
  title: string;
  year: number;
};

type WeeklyGoal = {
  id: string;
  title: string;
  weeklyPlanId: string;
  yearlyGoalId: string | null;
  createdAt: string;
};

type Todo = {
  id: string;
  title: string;
  status: "TODO" | "DOING" | "DONE";
  dayOfWeek: number;
  weeklyPlanId: string;
  weeklyGoalId: string | null;
};

type WeeklyPlan = {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  memo: string | null;
  retrospective: string | null;
  weeklyGoals: WeeklyGoal[];
};

const MAX_WEEKLY_GOALS = 5;
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export default function WeeklyPage() {
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalYearlyGoalId, setGoalYearlyGoalId] = useState("");
  const [goalError, setGoalError] = useState<string | null>(null);

  const [memo, setMemo] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);

  const selectedPlan = weeklyPlans.find((p) => p.id === selectedPlanId) ?? null;

  async function loadWeeklyPlans() {
    const res = await fetch("/api/weekly-plans");
    const data: WeeklyPlan[] = await res.json();
    setWeeklyPlans(data);
    return data;
  }

  async function loadYearlyGoals() {
    const res = await fetch("/api/goals");
    const data: YearlyGoal[] = await res.json();
    setYearlyGoals(data);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const plans = await loadWeeklyPlans();
      await loadYearlyGoals();
      if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    setMemo(selectedPlan?.memo ?? "");
    setGoalError(null);
  }, [selectedPlanId]);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!newStart || !newEnd) return;

    const res = await fetch("/api/weekly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStartDate: newStart, weekEndDate: newEnd }),
    });

    if (res.ok) {
      const created: WeeklyPlan = await res.json();
      setNewStart("");
      setNewEnd("");
      await loadWeeklyPlans();
      setSelectedPlanId(created.id);
    }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setGoalError(null);
    if (!selectedPlanId || !goalTitle.trim()) return;

    const res = await fetch(`/api/weekly-plans/${selectedPlanId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalTitle,
        yearlyGoalId: goalYearlyGoalId || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setGoalError(data.error ?? "주간 목표 생성에 실패했습니다.");
      return;
    }

    setGoalTitle("");
    setGoalYearlyGoalId("");
    await loadWeeklyPlans();
  }

  async function handleSaveMemo() {
    if (!selectedPlanId) return;
    setMemoSaving(true);
    await fetch(`/api/weekly-plans/${selectedPlanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo }),
    });
    await loadWeeklyPlans();
    setMemoSaving(false);
  }

  if (loading) {
    return <main style={{ padding: 32 }}>불러오는 중...</main>;
  }

  const goalCount = selectedPlan?.weeklyGoals.length ?? 0;
  const atGoalLimit = goalCount >= MAX_WEEKLY_GOALS;

  return (
    <main style={{ padding: 32, maxWidth: 720, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>주간 계획</h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18 }}>주간 계획 선택</h2>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        >
          <option value="" disabled>
            주간 계획을 선택하세요
          </option>
          {weeklyPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {toDateInputValue(plan.weekStartDate)} ~ {toDateInputValue(plan.weekEndDate)}
            </option>
          ))}
        </select>

        <form onSubmit={handleCreatePlan} style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            required
          />
          <span>~</span>
          <input
            type="date"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            required
          />
          <button type="submit">새 주간 계획 만들기</button>
        </form>
      </section>

      {selectedPlan && (
        <>
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18 }}>
              이번 주 목표 ({goalCount}/{MAX_WEEKLY_GOALS})
            </h2>
            <ul>
              {selectedPlan.weeklyGoals.map((goal) => (
                <li key={goal.id}>
                  {goal.title}
                  {goal.yearlyGoalId && (
                    <span style={{ color: "#666" }}>
                      {" "}
                      — 연결된 1년 목표:{" "}
                      {yearlyGoals.find((g) => g.id === goal.yearlyGoalId)?.title ??
                        goal.yearlyGoalId}
                    </span>
                  )}
                </li>
              ))}
              {goalCount === 0 && <li style={{ color: "#666" }}>아직 목표가 없습니다.</li>}
            </ul>

            <form onSubmit={handleCreateGoal} style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="새 주간 목표"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                disabled={atGoalLimit}
                required
              />
              <select
                value={goalYearlyGoalId}
                onChange={(e) => setGoalYearlyGoalId(e.target.value)}
                disabled={atGoalLimit}
              >
                <option value="">1년 목표 연결 안 함</option>
                {yearlyGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.year}] {g.title}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={atGoalLimit}>
                목표 추가
              </button>
            </form>
            {goalError && <p style={{ color: "red" }}>{goalError}</p>}
          </section>

          <section>
            <h2 style={{ fontSize: 18 }}>주간 메모</h2>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              style={{ width: "100%", padding: 8 }}
            />
            <div style={{ marginTop: 8 }}>
              <button onClick={handleSaveMemo} disabled={memoSaving}>
                {memoSaving ? "저장 중..." : "메모 저장"}
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
