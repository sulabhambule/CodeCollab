import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

export default function CodeEditor({
  code,
  language,
  onChange,
  cursors = {},
  userName,
  onCursorChange,
}) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
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

    // 📍 Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        const { lineNumber, column } = e.position;
        onCursorChange({ line: lineNumber, column });
      }
    });
  };

  // 🎨 Render remote cursors using Monaco's native decoration API
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const monaco = window.monaco;
    const decorations = [];
    const widgets = [];

    // User colors mapping (consistent colors for each user)
    const getUserColor = (name) => {
      const colors = [
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#FFD93D", // Yellow
        "#6BCF7F", // Green
        "#A78BFA", // Purple
        "#FB923C", // Orange
        "#F472B6", // Pink
        "#38BDF8", // Sky Blue
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    Object.entries(cursors).forEach(([cursorUserName, position]) => {
      if (cursorUserName === userName) return; // Skip own cursor

      const color = getUserColor(cursorUserName);
      const { line, column } = position;

      // ✨ Monaco's native cursor decoration with border
      decorations.push({
        range: new monaco.Range(line, column, line, column),
        options: {
          // Cursor line (vertical bar)
          className: "remote-cursor-line",
          // Inline style for colored border
          before: {
            content: "",
            inlineClassName: "remote-cursor-bar",
            cursorStops: monaco.editor.InjectedTextCursorStops.None,
          },
          // Style the decoration
          inlineClassName: "remote-cursor-inline",
          // Add to overview ruler (minimap)
          overviewRuler: {
            color: color,
            position: monaco.editor.OverviewRulerLane.Full,
          },
          // Glyph margin (left side) indicator
          glyphMarginClassName: "remote-cursor-glyph",
          glyphMarginHoverMessage: { value: `**${cursorUserName}** is here` },
          zIndex: 100,
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Create username label widget
      const labelWidget = {
        domNode: null,
        getId: () => `cursor.${cursorUserName}.${line}.${column}`,
        getDomNode: function () {
          if (!this.domNode) {
            this.domNode = document.createElement("div");
            this.domNode.className = "remote-cursor-label";
            this.domNode.style.cssText = `
              background: ${color};
              color: white;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            `;
            this.domNode.textContent = cursorUserName;
          }
          return this.domNode;
        },
        getPosition: () => ({
          position: { lineNumber: line, column: column },
          preference: [
            monaco.editor.ContentWidgetPositionPreference.ABOVE,
            monaco.editor.ContentWidgetPositionPreference.BELOW,
          ],
        }),
      };

      editor.addContentWidget(labelWidget);
      widgets.push(labelWidget);

      // Add a thin vertical line as the actual cursor
      const cursorWidget = {
        domNode: null,
        getId: () => `cursor.line.${cursorUserName}.${line}.${column}`,
        getDomNode: function () {
          if (!this.domNode) {
            this.domNode = document.createElement("div");
            this.domNode.style.cssText = `
              width: 2px;
              height: 20px;
              background: ${color};
              animation: cursor-blink 1s infinite;
              pointer-events: none;
            `;
          }
          return this.domNode;
        },
        getPosition: () => ({
          position: { lineNumber: line, column: column },
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        }),
      };

      editor.addContentWidget(cursorWidget);
      widgets.push(cursorWidget);
    });

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations,
    );

    // Cleanup widgets
    return () => {
      widgets.forEach((widget) => editor.removeContentWidget(widget));
    };
  }, [cursors, userName]);

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
