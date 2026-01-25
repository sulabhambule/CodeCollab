export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-sm text-slate-300">{message}</span>
    </div>
  );
}

// Full-screen loading overlay
export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-[#0b0f1a] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
        </div>

        {/* Message */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium text-white">{message}</p>
          <div className="flex gap-1.5">
            <span
              className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline spinner (small)
export function Spinner({ size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin`}
    />
  );
}
