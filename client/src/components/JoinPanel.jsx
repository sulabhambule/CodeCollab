// components/JoinPanel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSession } from "../storage/session";
import { v4 as uuid } from "uuid";
import { Spinner } from "./Loading";

export default function JoinPanel() {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("java");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = () => {
    const id = uuid().slice(0, 6).toUpperCase();
    setRoomId(id);
  };

  // JOIN or CREATE (based on roomId)
  const handleStart = () => {
    if (!roomId || !userName) {
      alert("Room ID and Name are required");
      return;
    }

    setIsJoining(true);
    saveSession({ roomId, userName, language });

    // Small delay for smooth transition
    setTimeout(() => {
      navigate(`/room/${roomId}`);
    }, 300);
  };

  return (
    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20 hover:border-white/30">
      {/* Subtle gradient overlay */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
        Initialize Workspace
      </h2>

      {/* Room ID */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-4 py-3 rounded-lg bg-gray-900/80 border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white placeholder:text-gray-500"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
        <button
          onClick={handleGenerate}
          className="px-5 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700 hover:border-gray-600 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
        >
          Generate
        </button>
      </div>

      {/* Name */}
      <input
        className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-900/80 border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white placeholder:text-gray-500"
        placeholder="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      {/* Language */}
      <select
        className="w-full mb-6 px-4 py-3 rounded-lg bg-gray-900/80 border border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 text-white cursor-pointer"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
      </select>

      {/* Start */}
      <button
        onClick={handleStart}
        disabled={isJoining}
        className="w-full py-3.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
      >
        {isJoining ? (
          <>
            <Spinner size="sm" />
            <span>Joining...</span>
          </>
        ) : (
          <span>Start Session →</span>
        )}
      </button>
    </div>
  );
}
