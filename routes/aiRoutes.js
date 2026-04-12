const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { PdfReader } = require("pdfreader");

function extractTextFromPDF(base64) {
  return new Promise((resolve, reject) => {
    const cleaned = base64.replace(/^data:application\/pdf;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");

    if (buffer.slice(0, 4).toString() !== "%PDF") {
      return reject(new Error("Not a valid PDF file"));
    }

    const rows = {};
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(err);
      if (!item) {
        // end of file — assemble text row by row
        const text = Object.keys(rows)
          .sort((a, b) => a - b)
          .map((y) => rows[y].join(" "))
          .join("\n");
        return resolve(text);
      }
      if (item.text) {
        const y = Math.round(item.y * 10);
        if (!rows[y]) rows[y] = [];
        rows[y].push(item.text);
      }
    });
  });
}

async function callGroq(prompt, apiKey) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq API error");
  return data.choices?.[0]?.message?.content || "";
}

router.get("/ping", authMiddleware, async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, message: "GROQ_API_KEY not set in .env" });
  try {
    const text = await callGroq("Reply with the single word: working", apiKey);
    res.json({ ok: true, groqResponse: text.trim() });
  } catch (e) {
    res.status(502).json({ ok: false, message: e.message });
  }
});

router.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { pdfBase64, prompt } = req.body;
    if (!pdfBase64 || !prompt) {
      return res.status(400).json({ message: "pdfBase64 and prompt are required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "GROQ_API_KEY not set in .env" });

    console.log("[AI] Extracting PDF text...");
    let resumeText;
    try {
      resumeText = await extractTextFromPDF(pdfBase64);
    } catch (e) {
      console.error("[AI] PDF error:", e.message);
      return res.status(400).json({ message: "Could not read PDF: " + e.message });
    }

    console.log("[AI] Extracted:", resumeText.length, "chars");

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        message: "Could not extract text — PDF may be a scanned image. Please use a text-based PDF.",
      });
    }

    console.log("[AI] Calling Groq...");
    const fullPrompt = `${prompt}\n\nRESUME TEXT:\n${resumeText.slice(0, 6000)}`;
    const text = await callGroq(fullPrompt, apiKey);
    console.log("[AI] Groq responded");

    const cleanedText = text.replace(/```json\s*|```\s*/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return res.json({ raw: cleanedText });
    }

    res.json({ result: parsed });
  } catch (error) {
    console.error("[AI] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;