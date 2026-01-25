import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, language, onChange }) {
  const handleEditorDidMount = (editor, monaco) => {
    // 🎨 Custom VS Code-like dark theme
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2a2a",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
      },
    });

    // Apply the theme immediately
    monaco.editor.setTheme("custom-dark");

    // 🔧 Enhanced editor configuration
    editor.updateOptions({
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      formatOnPaste: true,
      formatOnType: true,
      suggest: {
        insertMode: "replace",
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true,
      },
    });

    // 🎯 Add useful keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log("Save triggered (Ctrl+S)");
      // You can add save functionality here
    });

    // ⚡ Enable IntelliSense and autocomplete
    monaco.languages.registerCompletionItemProvider(mapLanguage(language), {
      provideCompletionItems: (model, position) => {
        const suggestions = [];

        // Add common programming keywords and patterns
        const keywords = getLanguageKeywords(language);
        keywords.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: `${language} keyword`,
          });
        });

        return { suggestions };
      },
    });
  };

  return (
    <Editor
      height="100%"
      theme="custom-dark"
      language={mapLanguage(language)}
      value={code}
      onChange={(value) => onChange(value || "")}
      onMount={handleEditorDidMount}
      options={{
        // 📝 Editor behavior
        fontSize: 14,
        fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
        fontLigatures: true,
        lineHeight: 21,
        letterSpacing: 0.5,

        // 🎨 Visual features
        minimap: { enabled: true, scale: 1 },
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12,
        },

        // 📏 Layout
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "off",
        wrappingIndent: "indent",

        // 🔍 Code features
        folding: true,
        foldingStrategy: "indentation",
        showFoldingControls: "always",
        unfoldOnClickAfterEndOfLine: true,

        // 💡 IntelliSense
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",
        wordBasedSuggestions: true,

        // 🎯 Editing
        autoIndent: "full",
        autoClosingBrackets: "languageDefined",
        autoClosingQuotes: "languageDefined",
        formatOnPaste: true,
        formatOnType: true,

        // 🖱️ Mouse & selection
        mouseWheelZoom: true,
        selectionHighlight: true,
        occurrencesHighlight: true,

        // 📋 Matching
        matchBrackets: "always",
        bracketPairColorization: {
          enabled: true,
        },

        // 📍 Guides & hints
        renderLineHighlight: "all",
        renderWhitespace: "selection",
        renderControlCharacters: true,
        renderIndentGuides: true,
        highlightActiveIndentGuide: true,

        // 🔢 Line numbers
        lineNumbers: "on",
        lineNumbersMinChars: 3,
        glyphMargin: true,

        // ⚡ Performance
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",

        // 🎨 Advanced
        colorDecorators: true,
        codeLens: true,
        contextmenu: true,
        links: true,
        detectIndentation: true,
        trimAutoWhitespace: true,

        // 📱 Accessibility
        accessibilitySupport: "auto",
      }}
    />
  );
}

function mapLanguage(lang) {
  const languageMap = {
    cpp: "cpp",
    c: "c",
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    java: "java",
    go: "go",
    rust: "rust",
    php: "php",
    ruby: "ruby",
    swift: "swift",
    kotlin: "kotlin",
    csharp: "csharp",
    html: "html",
    css: "css",
    json: "json",
    xml: "xml",
    sql: "sql",
    markdown: "markdown",
  };

  return languageMap[lang?.toLowerCase()] || lang || "javascript";
}

function getLanguageKeywords(language) {
  const keywords = {
    javascript: [
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "break",
      "continue",
      "class",
      "import",
      "export",
      "async",
      "await",
      "try",
      "catch",
      "finally",
      "throw",
      "new",
      "this",
    ],
    python: [
      "def",
      "class",
      "import",
      "from",
      "return",
      "if",
      "elif",
      "else",
      "for",
      "while",
      "break",
      "continue",
      "try",
      "except",
      "finally",
      "raise",
      "with",
      "lambda",
      "yield",
      "async",
      "await",
      "pass",
      "None",
      "True",
      "False",
    ],
    java: [
      "public",
      "private",
      "protected",
      "class",
      "interface",
      "extends",
      "implements",
      "return",
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "break",
      "continue",
      "try",
      "catch",
      "finally",
      "throw",
      "throws",
      "new",
      "this",
      "super",
      "static",
      "final",
      "void",
      "int",
      "String",
      "boolean",
      "double",
      "float",
    ],
    cpp: [
      "int",
      "char",
      "float",
      "double",
      "void",
      "bool",
      "class",
      "struct",
      "public",
      "private",
      "protected",
      "return",
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "break",
      "continue",
      "try",
      "catch",
      "throw",
      "new",
      "delete",
      "this",
      "namespace",
      "using",
      "const",
      "static",
      "virtual",
    ],
  };

  return keywords[language?.toLowerCase()] || [];
}
