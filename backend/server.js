import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await cohere.chat({
      model: "command-r", // chat model
      message: `You are AgriMate, a farming assistant.\nUser: ${message}`, // 👈 must be `message`
      temperature: 0.7,
    });

    res.json({ reply: response.text.trim() });
  } catch (err) {
    console.error("❌ Cohere API error:", err);
    res.status(500).json({ reply: "⚠️ Error connecting to AI server." });
  }
});

app.listen(5000, () =>
  console.log("✅ Cohere AI server running on http://localhost:5000")
);
