import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import Terminal from "../components/Terminal";
import CodeEditor from "../editor/CodeEditor";
import Navbar from "../components/Navbar";
import { LoadingOverlay } from "../components/Loading";
import useRoom from "../hooks/useRoom";

export default function Room() {
  const {
    connected,
    joined,
    roomId,
    userName,
    users,
    code,
    language,
    updateCode,
    updateLanguage,
    runCode,
    output,
    running,
    input,
    setInput,
    typingUser,
    cursors,
    updateCursor,
    leaveRoom,
  } = useRoom();

  // Show loading while joining room
  if (!joined) {
    return <LoadingOverlay message="Joining room..." />;
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white overflow-hidden pt-14">
      <Navbar typingUser={typingUser} />

      <Sidebar roomId={roomId} users={users} onLeave={leaveRoom} />

      <div className="flex-1 flex flex-col">
        {/* RUN BUTTON LIVES HERE */}
        <Toolbar
          language={language}
          onLanguageChange={updateLanguage}
          onRun={runCode}
          running={running}
        />

        <div className="flex-1">
          <CodeEditor
            code={code}
            language={language}
            onChange={updateCode}
            cursors={cursors}
            userName={userName}
            onCursorChange={updateCursor}
          />
        </div>

        <Terminal output={output} input={input} setInput={setInput} />
      </div>
    </div>
  );
}
