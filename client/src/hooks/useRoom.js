import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import { getSession, clearSession, saveSession } from "../storage/session";
import axios from "axios";

export default function useRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("// Start coding...");
  const [users, setUsers] = useState([]);

  const [typingUser, setTypingUser] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const typingTimerRef = useRef(null);

  // Socket connection (once)
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Auto-join using session
  useEffect(() => {
    const session = getSession();
    if (!session?.userName) return;

    setUserName(session.userName);
    setLanguage(session.language || "java");

    socket.emit("join", {
      roomId,
      userName: session.userName,
    });
  }, [roomId]);

  // Socket listeners
  useEffect(() => {
    socket.on("roomJoined", ({ code, language, users }) => {
      setCode(code);
      setLanguage(language);
      setUsers(users);
      setJoined(true);
    });

    socket.on("codeUpdate", setCode);
    socket.on("languageUpdate", setLanguage);
    socket.on("usersUpdate", setUsers);

    socket.on("userTyping", (name) => {
      setTypingUser(name);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingUser("");
      }, 1500);
    });

    return () => {
      socket.off("roomJoined");
      socket.off("codeUpdate");
      socket.off("languageUpdate");
      socket.off("usersUpdate");
      socket.off("userTyping");
    };
  }, []);

  // Actions
  const updateCode = useCallback(
    (newCode) => {
      setCode(newCode);

      if (!socket.connected) return;

      socket.emit("codeChange", {
        roomId,
        code: newCode,
      });

      socket.emit("typing", {
        roomId,
        userName,
      });
    },
    [roomId, userName],
  );

  const updateLanguage = (lang) => {
    setLanguage(lang);
    socket.emit("languageChange", { roomId, language: lang });
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    clearSession();
    socket.disconnect();
    navigate("/");
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput("⚠️ No code to run");
      return;
    }

    setRunning(true);
    setOutput("Running…");

    try {
      const res = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language,
        version: "*",
        files: [{ content: code }],
      });

      setOutput(res.data.run.output || res.data.run.stderr || "No output");
    } catch {
      setOutput("Execution error");
    } finally {
      setRunning(false);
    }
  };

  return {
    connected,
    joined,
    roomId,
    userName,
    language,
    code,
    users,
    typingUser,
    output,
    running,

    updateCode,
    updateLanguage,
    runCode,
    leaveRoom,
  };
}
