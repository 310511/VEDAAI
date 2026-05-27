import type { Assignment } from "@/types";

const statusStyles: Record<Assignment["status"], string> = {
  done: "bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]",
  processing: "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]",
  pending: "bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]",
  failed: "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]",
};

const statusLabels: Record<Assignment["status"], string> = {
  pending: "Draft",
  processing: "Generating",
  done: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: Assignment["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
