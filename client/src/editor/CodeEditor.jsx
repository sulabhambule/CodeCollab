import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, language, onChange }) {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={mapLanguage(language)}
      value={code}
      onChange={(value) => onChange(value || "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}

function mapLanguage(lang) {
  if (lang === "cpp") return "cpp";
  return lang;
}
