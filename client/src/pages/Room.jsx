import Sidebar from "../components/Sidebar";
import Toolbar from "../components/Toolbar";
import Terminal from "../components/Terminal";
import CodeEditor from "../editor/CodeEditor";
import useRoom from "../hooks/useRoom";

export default function Room() {
  const {
    roomId,
    users,
    code,
    language,
    updateCode,
    updateLanguage,
    runCode,
    output,
    running,
    typingUser,
    leaveRoom,
  } = useRoom();

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white overflow-hidden">
      <Sidebar roomId={roomId} users={users} onLeave={leaveRoom} />

      <div className="flex-1 flex flex-col">
        {/* RUN BUTTON LIVES HERE */}
        <Toolbar
          language={language}
          onLanguageChange={updateLanguage}
          onRun={runCode}
          running={running}
          typingUser={typingUser}
        />

        <div className="flex-1">
          <CodeEditor code={code} language={language} onChange={updateCode} />
        </div>

        <Terminal output={output} />
      </div>
    </div>
  );
}
