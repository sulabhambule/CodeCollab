export default function Terminal({ output }) {
  return (
    <div className="h-48 bg-slate-900 border-t border-slate-700">
      <div className="px-3 py-2 text-sm text-slate-400 border-b border-slate-700">
        Console Output
      </div>

      <pre className="p-3 text-sm text-slate-200 overflow-auto h-full">
        {output || "Run code to see output…"}
      </pre>
    </div>
  );
}
