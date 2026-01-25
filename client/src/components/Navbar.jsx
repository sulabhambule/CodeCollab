export default function Navbar({ typingUser }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="text-indigo-400">&lt;/&gt;</span>
          CodeCollab
        </div>

        {/* Center - Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-indigo-300">
              <strong>{typingUser}</strong> is typing...
            </span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            GitHub
          </a>

          {/* Status pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>
    </nav>
  );
}
