export function AssignmentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-4 shadow-sm md:p-5">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-4 h-3 w-full rounded bg-gray-100" />
      <div className="mt-3 h-6 w-20 rounded-full bg-gray-100" />
    </div>
  );
}
