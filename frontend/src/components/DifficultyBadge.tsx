import type { Difficulty } from "@/types";

const styles: Record<Difficulty, string> = {
  Easy: "bg-success-soft text-success",
  Moderate: "bg-warning-soft text-warning",
  Hard: "bg-danger-soft text-danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
