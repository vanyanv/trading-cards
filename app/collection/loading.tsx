export default function CollectionLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton mt-2 h-5 w-64" />
      </div>

      <div className="mb-8 h-px bg-border" />

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-5 w-24" />
        </div>
        <div className="skeleton h-10 w-full rounded-md" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-7 w-20 rounded-md" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton aspect-[2.5/3.5] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
