export default function Terminal({ output, input, setInput }) {
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
                      font-medium flex justify-between items-center"
      >
        <span>Console Output</span>
        <span className="text-xs text-slate-500">Stdin available below</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Output Area */}
        <pre className="flex-1 p-3 text-sm text-green-300 overflow-auto bg-black font-mono border-r border-slate-700">
          {output || "Run code to see output…"}
        </pre>

        {/* Input Area */}
        <div className="w-1/3 flex flex-col bg-[#0d1117]">
          <div className="px-2 py-1 text-xs text-slate-400 bg-slate-800 border-b border-slate-700">
            Standard Input (stdin)
          </div>
          <textarea
            className="flex-1 w-full bg-transparent p-2 text-white text-sm font-mono outline-none resize-none placeholder-slate-600"
            placeholder="Enter input here (e.g. 5 10)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
