export default function Hero() {
  return (
    <div className="space-y-6">
      {/* Badge */}
      <span className="inline-flex items-center gap-2 px-4 py-1 text-sm rounded-full bg-indigo-500/10 text-indigo-400">
        ⚡ v2.0 Live
      </span>

      {/* Heading */}
      <h1 className="text-5xl font-extrabold leading-tight">
        Lightning-fast <br />
        collab coding, <br />
        <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Zero friction.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 max-w-xl">
        Built for interviews, pair programming, and competitive coding. Create
        instant rooms with real-time sync and a VS Code–powered editor.
      </p>

      {/* Credibility */}
      <div className="text-sm text-gray-500">
        Open-source • React • Node.js • Socket.IO
      </div>
    </div>
  );
}
