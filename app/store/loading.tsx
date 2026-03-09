export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton mt-2 h-5 w-80" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="skeleton aspect-[3/4]" />
            <div className="p-4">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton mt-2 h-4 w-24" />
              <div className="mt-3 flex items-center justify-between">
                <div className="skeleton h-5 w-16" />
                <div className="skeleton h-7 w-14 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
