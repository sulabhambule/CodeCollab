import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://codecollab-x7b5.onrender.com";
// const API_BASE = "http://localhost:5000";

const QUICK_ACTIONS = [
  {
    id: "explain",
    label: "Explain Code",
    icon: "💡",
    desc: "Understand what the current code does",
  },
  {
    id: "fix",
    label: "Fix Bugs",
    icon: "🔧",
    desc: "Auto-detect and fix errors in the code",
  },
  {
    id: "generate",
    label: "Generate",
    icon: "✨",
    desc: "Generate code from a description",
  },
];

export default function AiPanel({ isOpen, onClose, code, language }) {
  const [prompt, setPrompt] = useState("");
  const [activeAction, setActiveAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendRequest = async (action, customPrompt) => {
    const isGenerate = action === "generate";

    // For 'generate', require a prompt
    if (isGenerate && !customPrompt.trim()) {
      setPrompt("");
      return;
    }

    const userMsg =
      action === "explain"
        ? "Explain this code"
        : action === "fix"
          ? "Fix bugs and logic in this code"
          : customPrompt.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMsg, action },
    ]);
    setPrompt("");
    setActiveAction(null);
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/api/ai`, {
        code: isGenerate ? "" : code,
        action,
        prompt: customPrompt || "",
      });

      const aiText = data?.result?.result || data?.result || "No response";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiText,
          type: data?.result?.type || "text",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Failed to get a response. Please try again.",
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionId) => {
    if (actionId === "generate") {
      // Open text input focused for generate
      setActiveAction("generate");
      setPrompt("");
    } else {
      sendRequest(actionId, "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    // If activeAction is set (generate), use it; otherwise "ask"
    sendRequest(activeAction || "ask", prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {isOpen && (
        <div
          className="ai-panel-backdrop"
          onClick={onClose}
          aria-label="Close AI panel"
        />
      )}

      <div className={`ai-panel ${isOpen ? "ai-panel--open" : ""}`}>
        {/* ── Header ── */}
        <div className="ai-panel__header">
          <div className="ai-panel__title">
            <span className="ai-panel__title-icon">🤖</span>
            <div>
              <h2 className="ai-panel__title-text">AI Assistant</h2>
              <p className="ai-panel__title-sub">Powered by Gemini</p>
            </div>
          </div>
          <div className="ai-panel__header-actions">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="ai-panel__icon-btn"
                title="Clear chat"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              className="ai-panel__icon-btn ai-panel__close-btn"
              title="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="ai-panel__body">
          {/* Quick Actions */}
          {messages.length === 0 && !loading && (
            <div className="ai-panel__welcome">
              <div className="ai-panel__welcome-icon">✨</div>
              <h3 className="ai-panel__welcome-title">
                What can I help with?
              </h3>
              <p className="ai-panel__welcome-desc">
                Use quick actions or type your own question below.
              </p>
              <div className="ai-panel__quick-actions">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.id}
                    onClick={() => handleQuickAction(qa.id)}
                    className="ai-panel__quick-btn"
                  >
                    <span className="ai-panel__quick-btn-icon">{qa.icon}</span>
                    <div>
                      <div className="ai-panel__quick-btn-label">
                        {qa.label}
                      </div>
                      <div className="ai-panel__quick-btn-desc">{qa.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="ai-panel__messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`ai-msg ai-msg--${msg.role}`}
                >
                  {msg.role === "ai" && (
                    <div className="ai-msg__avatar">🤖</div>
                  )}
                  <div
                    className={`ai-msg__bubble ${msg.type === "code" ? "ai-msg__bubble--code" : ""
                      } ${msg.type === "error" ? "ai-msg__bubble--error" : ""}`}
                  >
                    {msg.type === "code" ? (
                      <pre className="ai-msg__code-pre">
                        <code>{msg.text}</code>
                      </pre>
                    ) : (
                      <p className="ai-msg__text">{msg.text}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="ai-msg__avatar ai-msg__avatar--user">U</div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="ai-msg ai-msg--ai">
                  <div className="ai-msg__avatar">🤖</div>
                  <div className="ai-msg__bubble ai-msg__bubble--loading">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Loading state when no messages yet */}
          {loading && messages.length === 0 && (
            <div className="ai-panel__initial-loading">
              <div className="ai-spinner" />
              <p>Thinking…</p>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="ai-panel__footer">
          {activeAction === "generate" && (
            <div className="ai-panel__active-action-tag">
              <span>✨ Generate mode</span>
              <button
                onClick={() => setActiveAction(null)}
                className="ai-panel__tag-clear"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="ai-panel__input-row">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeAction === "generate"
                  ? "Describe the code you want generated…"
                  : "Ask anything about your code…"
              }
              rows={2}
              className="ai-panel__textarea"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="ai-panel__send-btn"
              title="Send (Enter)"
            >
              {loading ? (
                <span className="ai-spinner ai-spinner--sm" />
              ) : (
                "➤"
              )}
            </button>
          </form>
          <p className="ai-panel__hint">
            Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for newline
          </p>
        </div>
      </div>
    </>
  );
}
