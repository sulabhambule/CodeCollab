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
  const [input, setInput] = useState("");
  const [cursors, setCursors] = useState({}); // {userName: {line, column, color}}

  const typingTimerRef = useRef(null);
  const joinedRef = useRef(false); // prevents double join
  const codeUpdateTimerRef = useRef(null); // For debouncing code updates

  const lastTypingEmitRef = useRef(0);
  const stopTypingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // ⚡ CONNECTION RECOVERY & OPTIMIZATION
  const pendingUpdates = useRef([]);
  const reconnectAttempts = useRef(0);
  const lastCodeRef = useRef(""); // Track last code for diff optimization
  const lastCursorEmitRef = useRef(0); // Throttle cursor updates

  // ---- SOCKET CONNECT (ONCE) ----
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      console.log("✅ Socket connected");
      setConnected(true);
      reconnectAttempts.current = 0;

      // ⚡ RECOVERY: Resend pending updates after reconnection
      if (pendingUpdates.current.length > 0) {
        console.log(
          `🔄 Resending ${pendingUpdates.current.length} pending updates`,
        );
        pendingUpdates.current.forEach((update) => {
          socket.emit(update.event, update.data);
        });
        pendingUpdates.current = [];
      }
    };

    const onDisconnect = (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnected(false);
      joinedRef.current = false; // Reset join state on disconnect

      // Auto-reconnect with exponential backoff (max 3 attempts)
      if (reason === "io server disconnect") {
        // Server disconnected us, reconnect manually
        if (reconnectAttempts.current < 3) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            5000,
          );
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            reconnectAttempts.current++;
            socket.connect();
          }, delay);
        }
      }
    };

    const onConnectError = (error) => {
      console.error("❌ Connection error:", error.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
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

    const handleCursorUpdate = ({ userName: cursorUserName, position }) => {
      setCursors((prev) => ({
        ...prev,
        [cursorUserName]: position,
      }));
    };

    const handleCursorRemove = ({ userName: cursorUserName }) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[cursorUserName];
        return updated;
      });
    };

    socket.off("roomJoined");
    socket.off("codeUpdate");
    socket.off("languageUpdate");
    socket.off("usersUpdate");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("user-typing");
    socket.off("user-stopped-typing");
    socket.off("outputUpdate");
    socket.off("cursorUpdate");
    socket.off("cursorRemove");

    socket.on("roomJoined", handleRoomJoined);
    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("languageUpdate", handleLanguageUpdate);
    socket.on("usersUpdate", handleUsersUpdate);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stopped-typing", handleUserStoppedTyping);
    socket.on("outputUpdate", handleOutputUpdate);
    socket.on("cursorUpdate", handleCursorUpdate);
    socket.on("cursorRemove", handleCursorRemove);

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
      socket.off("cursorUpdate", handleCursorUpdate);
      socket.off("cursorRemove", handleCursorRemove);
    };
  }, []);

  // ---- ACTIONS ----
  const updateCode = useCallback(
    (newCode) => {
      // ⚡ OPTIMISTIC UPDATE: Update UI immediately
      setCode(newCode);
      if (!socket.connected) {
        // Queue update for when connection is restored
        pendingUpdates.current.push({
          event: "codeChange",
          data: { roomId, code: newCode },
        });
        return;
      }

      // 🎯 OPTIMIZATION: Only send if code actually changed
      if (newCode === lastCodeRef.current) return;
      lastCodeRef.current = newCode;

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          version: "*",
          files: [{ content: code }],
          stdin: input, // 🟢 Send user input to Piston API
        },
        {
          signal: controller.signal,
          timeout: 10000,
        },
      );

      clearTimeout(timeoutId);

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
    } catch (error) {
      let errorMsg = "Execution error";

      if (error.code === "ECONNABORTED" || error.name === "AbortError") {
        errorMsg = "⏱️ Execution timeout (10s limit exceeded)";
      } else if (error.response) {
        errorMsg = `❌ Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMsg = "🚫 Network error - check your connection";
      }

      console.error("Code execution error:", error);
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

  // ⚡ THROTTLED CURSOR UPDATE (max 10 updates/sec)
  const updateCursor = useCallback(
    (position) => {
      if (!socket.connected || !joined) return;

      const now = Date.now();
      const CURSOR_THROTTLE = 100; // 100ms = 10 updates/sec

      if (now - lastCursorEmitRef.current >= CURSOR_THROTTLE) {
        socket.emit("cursorMove", { roomId, userName, position });
        lastCursorEmitRef.current = now;
      }
    },
    [roomId, userName, joined],
  );

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
    cursors, // Export cursor positions

    updateCode,
    updateLanguage,
    runCode,
    leaveRoom,
    updateCursor, // Export cursor update function
  };
}
