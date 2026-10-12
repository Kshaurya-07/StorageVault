export function FileGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 flex flex-col justify-between h-56"
        >
          <div className="flex justify-between items-center">
            <div className="w-16 h-5 rounded-md bg-neutral-800" />
            <div className="w-6 h-6 rounded-md bg-neutral-800" />
          </div>
          <div className="h-24 rounded-xl bg-neutral-800/80 my-2" />
          <div className="space-y-2">
            <div className="w-3/4 h-3 rounded bg-neutral-800" />
            <div className="flex justify-between">
              <div className="w-1/3 h-2.5 rounded bg-neutral-800" />
              <div className="w-1/4 h-2.5 rounded bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FileTableSkeleton() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-12 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center px-4 justify-between"
        >
          <div className="flex items-center gap-3 w-1/3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800" />
            <div className="w-3/4 h-3.5 rounded bg-neutral-800" />
          </div>
          <div className="w-16 h-4 rounded bg-neutral-800" />
          <div className="w-16 h-3 rounded bg-neutral-800" />
          <div className="w-20 h-3 rounded bg-neutral-800" />
          <div className="w-12 h-6 rounded bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}

export default FileGridSkeleton;
