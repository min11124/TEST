"use client";

import { useEffect, useState } from "react";

type YearlyGoal = {
  id: string;
  title: string;
  description: string | null;
  year: number;
  createdAt: string;
  updatedAt: string;
};

const currentYear = new Date().getFullYear();

export default function GoalsPage() {
  const [goals, setGoals] = useState<YearlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newYear, setNewYear] = useState(currentYear);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editYear, setEditYear] = useState(currentYear);

  async function loadGoals() {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("목표 목록을 불러오지 못했습니다.");
      const data = await res.json();
      setGoals(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription || undefined,
        year: newYear,
      }),
    });

    if (res.ok) {
      setNewTitle("");
      setNewDescription("");
      setNewYear(currentYear);
      loadGoals();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "목표 생성에 실패했습니다.");
    }
  }

  function startEdit(goal: YearlyGoal) {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? "");
    setEditYear(goal.year);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        year: editYear,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      loadGoals();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "목표 수정에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadGoals();
    } else {
      setError("목표 삭제에 실패했습니다.");
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>1년 목표</h1>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form
        onSubmit={handleCreate}
        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32, border: "1px solid #ddd", padding: 16, borderRadius: 8 }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>새 목표 추가</h2>
        <input
          type="text"
          placeholder="제목"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <textarea
          placeholder="설명 (선택)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={{ padding: 8, minHeight: 60 }}
        />
        <input
          type="number"
          placeholder="연도"
          value={newYear}
          onChange={(e) => setNewYear(Number(e.target.value))}
          required
          style={{ padding: 8, width: 120 }}
        />
        <button type="submit" style={{ padding: "8px 16px", alignSelf: "flex-start" }}>
          추가
        </button>
      </form>

      {loading ? (
        <p>불러오는 중...</p>
      ) : goals.length === 0 ? (
        <p>등록된 목표가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((goal) => (
            <li key={goal.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              {editingId === goal.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ padding: 8 }}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ padding: 8, minHeight: 60 }}
                  />
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    style={{ padding: 8, width: 120 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleUpdate(goal.id)}>저장</button>
                    <button onClick={cancelEdit}>취소</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong>{goal.title}</strong>
                    <span style={{ color: "#666" }}>{goal.year}</span>
                  </div>
                  {goal.description && <p style={{ color: "#444" }}>{goal.description}</p>}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => startEdit(goal)}>수정</button>
                    <button onClick={() => handleDelete(goal.id)}>삭제</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
