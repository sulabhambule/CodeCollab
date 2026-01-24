export default function Terminal({ output }) {
  return (
    <div
      className="h-48 flex flex-col
                    bg-slate-900
                    border-t border-slate-700
                    z-10"
    >
      {/* Header */}
      <div
        className="px-3 py-2 text-sm
                      bg-slate-800
                      text-slate-300
                      border-b border-slate-700
                      font-medium"
      >
        Console Output
      </div>

      {/* Output */}
      <pre
        className="flex-1 p-3
                      text-sm text-green-300
                      overflow-auto
                      bg-black"
      >
        {output || "Run code to see output…"}
      </pre>
    </div>
  );
}
