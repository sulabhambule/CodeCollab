export default function Navbar({ typingUser }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-20 bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 text-xl font-bold group cursor-pointer">
          <span className="text-2xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
            &lt;/&gt;
          </span>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all duration-300">
            CodeCollab
          </span>
        </div>

        {/* Center - Typing Indicator */}
        {typingUser && (
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 backdrop-blur-sm shadow-lg shadow-indigo-500/10 animate-fade-in">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce shadow-sm shadow-indigo-400"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce shadow-sm shadow-indigo-400"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce shadow-sm shadow-indigo-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-indigo-200 font-medium">
              <strong className="text-indigo-300">{typingUser}</strong> is
              typing...
            </span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 relative group"
          >
            <span className="relative z-10">GitHub</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-400 to-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </a>

          {/* Status pill */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-400 text-xs font-semibold shadow-sm hover:shadow-green-500/20 transition-all duration-200">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400" />
            Online
          </div>
        </div>
      </div>
    </nav>
  );
}
