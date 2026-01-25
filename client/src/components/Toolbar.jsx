export default function Toolbar({
  language,
  onLanguageChange,
  onRun,
  running,
}) {
  return (
    <div
      className="h-12 flex items-center gap-3 px-4
      bg-slate-800 border-b border-slate-700 z-10"
    >
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="bg-slate-900 text-white px-3 py-1.5 rounded border border-slate-600 text-sm focus:outline-none focus:border-indigo-500"
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      <button
        onClick={onRun}
        disabled={running}
        className="px-4 py-1.5 rounded text-sm font-medium
          bg-green-600 hover:bg-green-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors"
      >
        {running ? "⏳ Running…" : "▶ Run Code"}
      </button>
    </div>
  );
}
