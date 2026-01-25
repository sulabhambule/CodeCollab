import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import { getSession, clearSession } from "../storage/session";
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
  const [input, setInput] = useState(""); // 🟢 New state for stdin input

  const typingTimerRef = useRef(null);
  const joinedRef = useRef(false); // 🔒 prevents double join
  const codeUpdateTimerRef = useRef(null); // For debouncing code updates

  // 🎯 OPTIMIZED: Typing indicator throttling
  const lastTypingEmitRef = useRef(0); // Timestamp of last "typing" emit
  const stopTypingTimerRef = useRef(null); // Timer for "stop-typing" event
  const isTypingRef = useRef(false); // Track if we're currently marked as typing

  // ---- SOCKET CONNECT (ONCE) ----
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      console.log("Socket connected");
      setConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setConnected(false);
      joinedRef.current = false; // Reset join state on disconnect
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // ---- JOIN ROOM (SAFE & IDEMPOTENT) ----
  useEffect(() => {
    const session = getSession();
    if (!session?.userName) return;
    if (!socket.connected) return;
    if (joinedRef.current) return;

    setUserName(session.userName);
    setLanguage(session.language || "java");

    console.log("Joining room:", roomId, "as", session.userName);
    socket.emit("join", {
      roomId,
      userName: session.userName,
    });

    joinedRef.current = true;
  }, [roomId, connected]);

  // ---- SOCKET LISTENERS ----
  useEffect(() => {
    const handleRoomJoined = ({ code, language, users }) => {
      console.log("Room joined successfully. Users:", users);
      setCode(code);
      setLanguage(language);
      setUsers(users);
      setJoined(true);
    };

    const handleCodeUpdate = (newCode) => {
      setCode(newCode);
    };

    const handleLanguageUpdate = (newLanguage) => {
      setLanguage(newLanguage);
    };

    const handleUsersUpdate = (updatedUsers) => {
      console.log("Users updated:", updatedUsers);
      setUsers(updatedUsers);
    };

    // ✅ OPTIMIZED: Delta update - add single user
    const handleUserJoined = (newUser) => {
      console.log("User joined:", newUser.userName);
      setUsers((prev) => [...prev, newUser]);
    };

    // ✅ OPTIMIZED: Delta update - remove single user
    const handleUserLeft = (userName) => {
      console.log("User left:", userName);
      setUsers((prev) => prev.filter((u) => u.userName !== userName));
    };

    const handleUserTyping = (name) => {
      setTypingUser(name);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingUser("");
      }, 1500);
    };

    const handleUserStoppedTyping = (name) => {
      if (typingUser === name) {
        setTypingUser("");
      }
    };

    const handleOutputUpdate = ({
      output,
      running,
      userName: executingUser,
    }) => {
      console.log(`Code output from ${executingUser}:`, output);
      setOutput(output);
      setRunning(running);
    };

    // Remove any existing listeners before adding new ones
    socket.off("roomJoined");
    socket.off("codeUpdate");
    socket.off("languageUpdate");
    socket.off("usersUpdate");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("user-typing");
    socket.off("user-stopped-typing");
    socket.off("outputUpdate");

    socket.on("roomJoined", handleRoomJoined);
    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("languageUpdate", handleLanguageUpdate);
    socket.on("usersUpdate", handleUsersUpdate);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stopped-typing", handleUserStoppedTyping);
    socket.on("outputUpdate", handleOutputUpdate);

    return () => {
      socket.off("roomJoined", handleRoomJoined);
      socket.off("codeUpdate", handleCodeUpdate);
      socket.off("languageUpdate", handleLanguageUpdate);
      socket.off("usersUpdate", handleUsersUpdate);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
      socket.off("outputUpdate", handleOutputUpdate);
    };
  }, []);

  // ---- ACTIONS ----
  const updateCode = useCallback(
    (newCode) => {
      setCode(newCode);
      if (!socket.connected) return;

      // Debounce code updates to reduce lag
      clearTimeout(codeUpdateTimerRef.current);
      codeUpdateTimerRef.current = setTimeout(() => {
        socket.emit("codeChange", { roomId, code: newCode });
      }, 300); // Wait 300ms after user stops typing

      // ✅ OPTIMIZED: Throttled typing indicator (emit max once per 2 seconds)
      const now = Date.now();
      const TYPING_THROTTLE = 2000; // 2 seconds
      const STOP_TYPING_DELAY = 1500; // 1.5 seconds

      if (now - lastTypingEmitRef.current >= TYPING_THROTTLE) {
        socket.emit("typing", { roomId, userName });
        lastTypingEmitRef.current = now;
        isTypingRef.current = true;
      }

      // ✅ OPTIMIZED: Emit "stop-typing" after 1.5s of inactivity
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          socket.emit("stop-typing", { roomId, userName });
          isTypingRef.current = false;
        }
      }, STOP_TYPING_DELAY);
    },
    [roomId, userName],
  );

  const updateLanguage = (lang) => {
    setLanguage(lang);
    socket.emit("languageChange", { roomId, language: lang });
  };

  const leaveRoom = () => {
    console.log("Leaving room");

    // Emit stop-typing before leaving
    if (isTypingRef.current) {
      socket.emit("stop-typing", { roomId, userName });
      isTypingRef.current = false;
    }

    socket.emit("leaveRoom");
    joinedRef.current = false;
    setJoined(false);
    clearSession();

    // Clean up timers
    clearTimeout(typingTimerRef.current);
    clearTimeout(codeUpdateTimerRef.current);
    clearTimeout(stopTypingTimerRef.current);

    navigate("/");
  };

  const runCode = async () => {
    if (!code.trim()) {
      const outputMsg = "⚠️ No code to run";
      setOutput(outputMsg);
      // Broadcast to all users
      socket.emit("codeExecution", {
        roomId,
        output: outputMsg,
        running: false,
        userName,
      });
      return;
    }

    setRunning(true);
    setOutput("Running…");

    // Notify all users that code is running
    socket.emit("codeExecution", {
      roomId,
      output: "Running…",
      running: true,
      userName,
    });

    try {
      const res = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language,
        version: "*",
        files: [{ content: code }],
        stdin: input, // 🟢 Send user input to Piston API
      });

      const outputMsg =
        res.data.run.output || res.data.run.stderr || "No output";
      setOutput(outputMsg);

      // Broadcast output to all users
      socket.emit("codeExecution", {
        roomId,
        output: outputMsg,
        running: false,
        userName,
      });
    } catch {
      const errorMsg = "Execution error";
      setOutput(errorMsg);

      // Broadcast error to all users
      socket.emit("codeExecution", {
        roomId,
        output: errorMsg,
        running: false,
        userName,
      });
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
    input, // Export input
    setInput, // Export input setter

    updateCode,
    updateLanguage,
    runCode,
    leaveRoom,
  };
}
