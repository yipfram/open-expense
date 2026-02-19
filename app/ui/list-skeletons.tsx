type CardListSkeletonProps = {
  rows?: number;
};

type TableSkeletonProps = {
  rows?: number;
};

export function CardListSkeleton({ rows = 4 }: CardListSkeletonProps) {
  return (
    <ul className="mt-4 grid gap-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-200" />
        </li>
      ))}
    </ul>
  );
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  const columns = 5;

  return (
    <div className="mt-4 w-full overflow-x-auto" aria-hidden>
      <div className="min-w-[760px] rounded-lg border border-slate-200">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-200 p-3">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
        <div className="grid gap-2 p-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-4">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div key={columnIndex} className="h-4 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
