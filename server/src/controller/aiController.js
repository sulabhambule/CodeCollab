import { handleAIRequest } from "../Services/aiService.js";

const aiController = async (req, res) => {
  try {
    const { code, action, prompt } = req.body;

    // basic validatoin
    if (!code && !prompt) {
      return res.status(400).json({
        error: "Code or prompt is required!",
      });
    }

    const result = await handleAIRequest({ code, action, prompt });
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("AI controller error", error);

    return res.status(500).json({
      success: false,
      error: "Something went wrong",
    });
  }
};

export { aiController };
