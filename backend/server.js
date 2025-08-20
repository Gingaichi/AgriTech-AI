import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";
import sqlite3 from "sqlite3";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Initialize SQLite database (use the same one as Django)
const dbPath = path.join(__dirname, '../ai_models/db.sqlite3');
const db = new sqlite3.Database(dbPath);

// Create chat tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    images TEXT, -- JSON array of base64 images
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
  )`);
});

// Helper function to convert images to base64
const imagesToBase64 = async (files) => {
  if (!files || files.length === 0) return [];
  
  return files.map(file => {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  });
};

// Helper function to get AI response
const getAIResponse = async (message) => {
  try {
    const response = await cohere.chat({
      model: "command-r",
      message: `You are AgriMate, a farming assistant.\nUser: ${message}`,
      temperature: 0.7,
    });
    return response.text.trim();
  } catch (error) {
    console.error("❌ Cohere API error:", error);
    return "⚠️ Error connecting to AI server.";
  }
};

// Create a new chat
app.post("/api/chats", upload.array('images'), async (req, res) => {
  try {
    const { message } = req.body;
    const images = await imagesToBase64(req.files);
    
    const chatId = uuidv4();
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4();
    
    // Generate title from first message (truncated)
    const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    
    // Get AI response
    const aiResponse = await getAIResponse(message);
    
    // Start transaction
    db.serialize(() => {
      // Create chat
      db.run(
        "INSERT INTO chats (id, title) VALUES (?, ?)",
        [chatId, title]
      );
      
      // Add user message
      db.run(
        "INSERT INTO chat_messages (id, chat_id, content, sender, images) VALUES (?, ?, ?, ?, ?)",
        [userMessageId, chatId, message, 'user', JSON.stringify(images)]
      );
      
      // Add AI response
      db.run(
        "INSERT INTO chat_messages (id, chat_id, content, sender) VALUES (?, ?, ?, ?)",
        [aiMessageId, chatId, aiResponse, 'ai'],
        function(err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to create chat" });
          }
          
          // Return the created chat with messages
          const chat = {
            id: chatId,
            title: title,
            lastMessage: aiResponse,
            lastMessageTime: new Date().toISOString(),
            messages: [
              {
                id: userMessageId,
                content: message,
                images: images,
                timestamp: new Date().toISOString(),
                sender: 'user'
              },
              {
                id: aiMessageId,
                content: aiResponse,
                timestamp: new Date().toISOString(),
                sender: 'ai'
              }
            ],
            createdAt: new Date().toISOString()
          };
          
          res.json({ chat });
        }
      );
    });
    
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Get all chats
app.get("/api/chats", (req, res) => {
  const query = `
    SELECT c.id, c.title, c.created_at,
           m.content as last_message, m.timestamp as last_message_time
    FROM chats c
    LEFT JOIN chat_messages m ON c.id = m.chat_id
    WHERE m.id = (
      SELECT id FROM chat_messages 
      WHERE chat_id = c.id 
      ORDER BY timestamp DESC 
      LIMIT 1
    )
    ORDER BY c.updated_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch chats" });
    }
    
    const chats = rows.map(row => ({
      id: row.id,
      title: row.title,
      lastMessage: row.last_message || '',
      lastMessageTime: row.last_message_time || row.created_at,
      createdAt: row.created_at
    }));
    
    res.json({ chats });
  });
});

// Get specific chat with messages
app.get("/api/chat/:id", (req, res) => {
  const chatId = req.params.id;
  
  // Get chat info
  db.get("SELECT * FROM chats WHERE id = ?", [chatId], (err, chat) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch chat" });
    }
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    
    // Get messages
    db.all(
      "SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC",
      [chatId],
      (err, messages) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to fetch messages" });
        }
        
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          images: msg.images ? JSON.parse(msg.images) : [],
          timestamp: msg.timestamp,
          sender: msg.sender
        }));
        
        // Get last message info
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        
        const chatData = {
          id: chat.id,
          title: chat.title,
          lastMessage: lastMessage ? lastMessage.content : '',
          lastMessageTime: lastMessage ? lastMessage.timestamp : chat.created_at,
          messages: formattedMessages,
          createdAt: chat.created_at
        };
        
        res.json({ chat: chatData });
      }
    );
  });
});

// Send message to existing chat
app.post("/api/chat/:id/message", upload.array('images'), async (req, res) => {
  try {
    const chatId = req.params.id;
    const { message } = req.body;
    const images = await imagesToBase64(req.files);
    
    const userMessageId = uuidv4();
    const aiMessageId = uuidv4();
    
    // Get AI response
    const aiResponse = await getAIResponse(message);
    
    // Start transaction
    db.serialize(() => {
      // Add user message
      db.run(
        "INSERT INTO chat_messages (id, chat_id, content, sender, images) VALUES (?, ?, ?, ?, ?)",
        [userMessageId, chatId, message, 'user', JSON.stringify(images)]
      );
      
      // Add AI response
      db.run(
        "INSERT INTO chat_messages (id, chat_id, content, sender) VALUES (?, ?, ?, ?)",
        [aiMessageId, chatId, aiResponse, 'ai']
      );
      
      // Update chat updated_at
      db.run(
        "UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [chatId],
        function(err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to send message" });
          }
          
          const userMessage = {
            id: userMessageId,
            content: message,
            images: images,
            timestamp: new Date().toISOString(),
            sender: 'user'
          };
          
          const aiMessage = {
            id: aiMessageId,
            content: aiResponse,
            timestamp: new Date().toISOString(),
            sender: 'ai'
          };
          
          res.json({ userMessage, aiMessage });
        }
      );
    });
    
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Keep the original endpoint for backward compatibility
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const reply = await getAIResponse(message);
  res.json({ reply });
});

app.listen(5000, () =>
  console.log("✅ AgriTech AI server running on http://localhost:5000")
);
