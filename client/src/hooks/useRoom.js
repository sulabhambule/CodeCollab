import axios from "axios";
import {
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";
import {
  useParams,
  useNavigate
} from "react-router-dom";
import socket from "../socket/socket";
import { getSession, clearSession } from "../storage/session";

export default function useRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
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

  const pendingUpdates = useRef([]);
  const reconnectAttempts = useRef(0);
  const lastCodeRef = useRef("");
  const lastCursorEmitRef = useRef(0);


  // socket connection.
  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setConnected(true);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);


  // JOIN ROOM
  useEffect(() => {
    const session = getSession();
    if (!session?.userName || !session?.userId) return;
    if (!socket.connected) return;
    if (joinedRef.current) return;

    setUserName(session.userName);
    setUserId(session.userId);
    setLanguage(session.language || "java");

    socket.emit("join", {
      roomId,
      userName: session.userName,
      userId: session.userId
    });

    joinedRef.current = true;
  }, [roomId, connected]);

  // SOCKET LISTENERS 
  useEffect(() => {
    const handleRoomJoined = ({ code, language, users }) => {
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
      setUsers(updatedUsers);
    }; // this need to be removed see if usecase is there or not.

    const handleUserJoined = (newUser) => {
      setUsers((prev) => {
        const exits = prev.find((u) => u.userId === newUser.userId);
        if (exits) {
          return prev.map((user) =>
            user.userId === newUser.userId ? newUser : user
          );
        }
        return [...prev, newUser];
      })
    };

    const handleUserLeft = ({ userId }) => {
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const handleUserTyping = ({ userId, userName }) => {
      setTypingUser(userName);
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
      running
    }) => {
      setOutput(output);
      setRunning(running);
    };

    const handleCursorUpdate = ({ userId, position }) => {
      setCursors((prev) => ({
        ...prev,
        [userId]: position,
      }));
    };

    const handleCursorRemove = ({ userId }) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    socket.on("roomJoined", handleRoomJoined);
    socket.on("codeUpdate", handleCodeUpdate);
    socket.on("languageUpdate", handleLanguageUpdate);
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
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stopped-typing", handleUserStoppedTyping);
      socket.off("outputUpdate", handleOutputUpdate);
      socket.off("cursorUpdate", handleCursorUpdate);
      socket.off("cursorRemove", handleCursorRemove);
    };
  }, []);

  // CODE UPDATE
  const updateCode = useCallback(
    (newCode) => {
      setCode(newCode);
      // offline handling
      if (!socket.connected) {
        pendingUpdates.current.push({
          event: "codeChange",
          data: { roomId, code: newCode },
        });
        return;
      }

      // prevent duplicate emits. (avoid unecessary network call)
      if (newCode === lastCodeRef.current) return;
      lastCodeRef.current = newCode;

      // Debounced code sync
      clearTimeout(codeUpdateTimerRef.current);
      codeUpdateTimerRef.current = setTimeout(() => {
        socket.emit("codeChange", { roomId, code: newCode });
      }, 300);

      // typing indicator logic
      const now = Date.now();
      const TYPING_THROTTLE = 2000; // 2 seconds
      const STOP_TYPING_DELAY = 1500; // 1.5 seconds

      if (now - lastTypingEmitRef.current >= TYPING_THROTTLE) {
        socket.emit("typing", {
          roomId,
          userId,
          userName
        });

        lastTypingEmitRef.current = now;
        isTypingRef.current = true;
      }

      // Emit "stop-typing" after 1.5s of inactivity
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          socket.emit("stop-typing", {
            roomId,
            userId,
            userName
          });

          isTypingRef.current = false;
        }
      }, STOP_TYPING_DELAY);
    },
    [roomId, userId, userName],
  );

  const updateLanguage = (lang) => {
    setLanguage(lang);
    socket.emit("languageChange", { roomId, language: lang });
  };

  const leaveRoom = () => {
    if (isTypingRef.current) {
      socket.emit("stop-typing", {
        roomId,
        userId,
        userName
      });
      isTypingRef.current = false;
    }

    socket.emit("leaveRoom");
    socket.removeAllListeners();
    socket.close();

    joinedRef.current = false;
    setJoined(false);

    clearSession();
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
        userId
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
      userId,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await axios.post(
        // "http://localhost:5000/code/run",
        "http://34.207.131.98:8080/code/run",

        {
          language,
          version: "*",
          code,
          stdin: input,
        },
        {
          signal: controller.signal,
          timeout: 10000,
        },
      );

      clearTimeout(timeoutId);

      const outputMsg =
        res.data.run?.output || res.data.run?.stderr || "No output";

      // Broadcast output to all users
      socket.emit("codeExecution", {
        roomId,
        output: outputMsg,
        running: false,
        userName,
        userId
      });
      setOutput(outputMsg);
    } catch (error) {
      let errorMsg = "Execution error";

      if (error.code === "ECONNABORTED" || error.name === "AbortError") {
        errorMsg = "Execution timeout (10s limit exceeded)";
      } else if (error.response) {
        errorMsg = ` Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMsg = " Network error - check your connection";
      }
      socket.emit("codeExecution", {
        roomId,
        output: errorMsg,
        running: false,
        userName,
        userId
      });

      setOutput(errorMsg);
    } finally {
      setRunning(false);
    }
  };

  const updateCursor = useCallback(
    (position) => {
      if (!socket.connected || !joined) return;

      const now = Date.now();
      const CURSOR_THROTTLE = 100; // 100ms = 10 updates/sec

      if (now - lastCursorEmitRef.current >= CURSOR_THROTTLE) {
        socket.emit("cursorMove", {
          roomId,
          userId,
          userName,
          position
        });

        lastCursorEmitRef.current = now;
      }
    },
    [roomId, userId, userName, joined],
  );

  return {
    connected,
    joined,
    roomId,
    userName,
    userId,
    language,
    code,
    users,
    typingUser,
    output,
    running,
    input,
    setInput,
    cursors,

    updateCode,
    updateLanguage,
    runCode,
    leaveRoom,
    updateCursor,
  };
}
