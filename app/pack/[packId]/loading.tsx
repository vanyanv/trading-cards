export default function PackDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="skeleton mb-8 h-4 w-24" />

      <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
        <div className="skeleton h-80 w-56 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-4 w-80" />
          <div className="skeleton mt-4 h-4 w-48" />
          <div className="skeleton mt-6 h-11 w-36 rounded-lg" />
        </div>
      </div>

      <div className="mt-14 flex gap-6 border-b border-border pb-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-16" />
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-2 flex-1 rounded-full" />
            <div className="skeleton h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
