import https from "https";

// ---------------------------------------------------------------------------
// JDoodle language map
// JDoodle uses (language, versionIndex) pairs instead of semver strings.
// Full list: https://www.jdoodle.com/compiler-api
// ---------------------------------------------------------------------------
const JDOODLE_LANG_MAP = {
  // key = what your client sends  →  { language, versionIndex }
  javascript: { language: "nodejs", versionIndex: "4" },
  typescript: { language: "typescript", versionIndex: "1" },
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "5" },
  c: { language: "c", versionIndex: "5" },
  cpp: { language: "cpp17", versionIndex: "1" },
  "c++": { language: "cpp17", versionIndex: "1" },
  csharp: { language: "csharp", versionIndex: "4" },
  "c#": { language: "csharp", versionIndex: "4" },
  rust: { language: "rust", versionIndex: "4" },
  go: { language: "go", versionIndex: "4" },
  ruby: { language: "ruby", versionIndex: "4" },
  php: { language: "php", versionIndex: "4" },
  swift: { language: "swift", versionIndex: "4" },
  kotlin: { language: "kotlin", versionIndex: "3" },
  scala: { language: "scala", versionIndex: "4" },
  r: { language: "r", versionIndex: "4" },
  bash: { language: "bash", versionIndex: "4" },
  perl: { language: "perl", versionIndex: "4" },
  haskell: { language: "haskell", versionIndex: "4" },
};

// ---------------------------------------------------------------------------
// Helper: POST to JDoodle's /api/v1/execute
// ---------------------------------------------------------------------------
function jdoodleRequest(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const options = {
      hostname: "api.jdoodle.com",
      path: "/v1/execute",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          reject(new Error("Invalid JSON from JDoodle"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export const runCode = async (req, res) => {
  try {
    const { language, code, stdin = "" } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "language and code are required" });
    }

    // ── Validate JDoodle credentials ─────────────────────────────────────
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("JDoodle credentials missing in .env");
      return res.status(503).json({
        error:
          "Code execution is not configured. " +
          "Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file. " +
          "Get free credentials at https://www.jdoodle.com/compiler-api",
      });
    }

    // ── Map language ──────────────────────────────────────────────────────
    const langKey = language.toLowerCase();
    const langMeta = JDOODLE_LANG_MAP[langKey];

    if (!langMeta) {
      return res.status(400).json({
        error: `Unsupported language: "${language}". Supported: ${Object.keys(JDOODLE_LANG_MAP).join(", ")}`,
      });
    }

    // ── Execute ───────────────────────────────────────────────────────────
    const { status, data } = await jdoodleRequest({
      clientId,
      clientSecret,
      script: code,
      stdin,
      language: langMeta.language,
      versionIndex: langMeta.versionIndex,
    });

    if (status !== 200) {
      console.error("JDoodle error:", status, data);
      return res.status(502).json({ error: `JDoodle returned status ${status}`, detail: data });
    }

    // ── Normalise response to match what the client already expects ───────
    // Client reads:  res.data.run?.output  ||  res.data.run?.stderr
    // JDoodle returns: { output, statusCode, memory, cpuTime, ... }
    return res.status(200).json({
      run: {
        output: data.output ?? "",
        stderr: data.error ?? "",
        code: data.statusCode,
      },
      memory: data.memory,
      cpuTime: data.cpuTime,
    });
  } catch (err) {
    console.error("Code execution proxy error:", err.message);
    return res.status(500).json({ error: "Code execution failed" });
  }
};
