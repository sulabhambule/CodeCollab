export default function Toolbar({
  language,
  onLanguageChange,
  onRun,
  running,
  typingUser,
}) {
  return (
    <div
      className="h-12 flex items-center justify-between px-4
      bg-slate-800 border-b border-slate-700 z-10"
    >
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-600"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button
          onClick={onRun}
          disabled={running}
          className="px-3 py-1 rounded
            bg-green-600 hover:bg-green-700
            disabled:opacity-50"
        >
          {running ? "Running…" : "Run"}
        </button>
      </div>

      <div className="text-sm text-slate-400">
        {typingUser && `${typingUser} is typing…`}
      </div>
    </div>
  );
}
