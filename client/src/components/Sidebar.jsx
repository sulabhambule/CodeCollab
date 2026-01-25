export default function Sidebar({ roomId, users, onLeave }) {
  return (
    <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h1 className="font-bold text-lg">&lt;/&gt; CodeCollab</h1>
        <p className="text-sm text-gray-400 mt-1">
          Room ID: <span className="text-indigo-400">{roomId}</span>
        </p>
      </div>

      {/* Users */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-sm text-gray-400 mb-2">ONLINE ({users.length})</h2>

        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.socketId || u._id || u.userName}
              className="flex items-center gap-3 bg-white/5 rounded px-3 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                {(u.userName || u)[0]?.toUpperCase()}
              </div>
              <span className="text-sm">{u.userName || u}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLeave}
          className="w-full py-2 rounded bg-red-600/80 hover:bg-red-600 transition"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
