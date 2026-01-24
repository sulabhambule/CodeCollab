export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="text-indigo-400">&lt;/&gt;</span>
          CodeCollab
        </div>

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
