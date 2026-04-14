export default function LoadingSkeleton() {
  return (
    <div id="loading-skeleton" className="max-w-7xl mx-auto px-6 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Answer panel skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <div className="h-8 w-48 animate-skeleton rounded-lg" />
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="h-4 animate-skeleton rounded w-full" />
            <div className="h-4 animate-skeleton rounded w-11/12" />
            <div className="h-4 animate-skeleton rounded w-10/12" />
            <div className="h-4 animate-skeleton rounded w-9/12" />
            <div className="h-4 animate-skeleton rounded w-full" />
            <div className="h-4 animate-skeleton rounded w-8/12" />
          </div>
          {/* Confidence ring skeleton */}
          <div className="flex items-center gap-4 mt-4">
            <div className="w-20 h-20 rounded-full animate-skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-skeleton rounded" />
              <div className="h-3 w-32 animate-skeleton rounded" />
            </div>
          </div>
        </div>

        {/* Sources skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 w-56 animate-skeleton rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <div className="h-4 animate-skeleton rounded w-3/4" />
              <div className="h-3 animate-skeleton rounded w-full" />
              <div className="h-3 animate-skeleton rounded w-5/6" />
              <div className="h-2 animate-skeleton rounded-full w-full mt-2" />
              <div className="h-3 animate-skeleton rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
