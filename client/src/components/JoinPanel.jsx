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

  // CREATE ROOM (explicit)
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
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold mb-4">Initialize Workspace</h2>

      {/* Room ID */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
        <button
          onClick={handleGenerate}
          className="px-3 rounded bg-gray-800 hover:bg-gray-700 text-sm"
        >
          Generate
        </button>
      </div>

      {/* Name */}
      <input
        className="w-full mb-3 px-3 py-2 rounded bg-gray-900 border border-gray-700"
        placeholder="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      {/* Language */}
      <select
        className="w-full mb-4 px-3 py-2 rounded bg-gray-900 border border-gray-700"
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
        className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
