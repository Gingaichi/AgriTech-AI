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
import fetch from "node-fetch";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the built frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Initialize SQLite database 
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../ai_models/db.sqlite3');
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

  // Create suggested questions cache table
  db.run(`CREATE TABLE IF NOT EXISTS suggested_questions_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questions TEXT NOT NULL, -- JSON array of questions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      message: `You are AgriMate, an expert agricultural assistant specialized in helping farmers in Malawi. 

Your responses should be:
- Well-structured and formatted using Markdown
- Clear and actionable for smallholder farmers
- Specific to Malawi's agricultural conditions
- Include practical examples and timing recommendations
- Use headers, bullet points, and numbered lists for clarity

When appropriate, format your responses with:
- ## Headers for main topics
- ### Sub-headers for specific sections
- **Bold text** for important points
- - Bullet points for lists
- 1. Numbered lists for step-by-step instructions
- > Blockquotes for important warnings or tips

User question: ${message}`,
      temperature: 0.7,
    });
    return response.text.trim();
  } catch (error) {
    console.error("❌ Cohere API error:", error);
    return "⚠️ Error connecting to AI server.";
  }
};

// Helper function to get AI response with image analysis
const getAIResponseWithImages = async (message, images = []) => {
  try {
    let imageAnalysisContext = "";
    
    // If images are provided, analyze them first
    if (images && images.length > 0) {
      try {
        console.log("🔬 Analyzing images for chat context...");
        
        // Create FormData for Django AI models
        const formData = new FormData();
        formData.append('crop_type', 'maize'); // Default crop type
        formData.append('latitude', '-13.9626'); // Lilongwe default
        formData.append('longitude', '33.7741');
        
        // Convert base64 images back to buffers for Django
        for (let i = 0; i < images.length; i++) {
          const base64Data = images[i].replace(/^data:image\/[a-z]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([buffer], { type: 'image/jpeg' });
          formData.append('crop_image', blob, `chat_image_${i}.jpg`);
        }
        
        // Try Django AI models first
        const aiModelsUrl = process.env.AI_MODELS_URL || 'http://localhost:8000';
        const djangoResponse = await fetch(`${aiModelsUrl}/api/analyze-crop/`, {
          method: 'POST',
          body: formData,
        });
        
        console.log('Django response status:', djangoResponse.status);
        console.log('Django response headers:', Object.fromEntries(djangoResponse.headers));
        
        if (djangoResponse.ok) {
          const responseText = await djangoResponse.text();
          console.log('Django raw response:', responseText);
          
          let analysisData;
          try {
            analysisData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response text:', responseText);
            throw new Error(`Invalid JSON response: ${parseError.message}`);
          }
          
          if (analysisData.success) {
            if (analysisData.disease_result) {
              const disease = analysisData.disease_result;
              imageAnalysisContext = `

**Image Analysis Results:**
- Plant identified: ${disease.plant_name || 'Unknown plant'}
- Health status: ${disease.is_healthy ? 'Healthy' : 'Potential issues detected'}
- Confidence: ${(disease.probability * 100).toFixed(1)}%
- Analysis: ${disease.message || 'No specific message'}

**Weather Context:**
- Current conditions: ${analysisData.weather?.conditions || 'Unknown'}
- Temperature: ${analysisData.weather?.temperature || 'N/A'}°C
- Crop prediction: ${analysisData.crop_prediction?.prediction || 'No prediction available'}

`;
            } else {
              // Image was uploaded but no disease detection (could be no Plant.ID API key)
              imageAnalysisContext = `

**Weather Context:**
- Current conditions: ${analysisData.weather?.conditions || 'Unknown'}
- Temperature: ${analysisData.weather?.temperature || 'N/A'}°C
- Crop prediction: ${analysisData.crop_prediction?.prediction || 'No prediction available'}

**Note:** Image uploaded but plant identification temporarily unavailable. Analysis based on weather and general agricultural advice.

`;
            }
          }
        } else {
          console.log("Django analysis failed, proceeding without image context");
        }
      } catch (imageError) {
        console.error("Image analysis error:", imageError);
        imageAnalysisContext = "\n**Note:** Image uploaded but analysis temporarily unavailable.\n";
      }
    }
    
    // Enhanced prompt with image context
    const enhancedMessage = `You are AgriMate, an expert agricultural assistant specialized in helping farmers in Malawi. 

${imageAnalysisContext}

Your responses should be:
- Well-structured and formatted using Markdown
- Clear and actionable for smallholder farmers
- Specific to Malawi's agricultural conditions
- Include practical examples and timing recommendations
- Use headers, bullet points, and numbered lists for clarity
- If image analysis is provided above, incorporate those findings into your response

When appropriate, format your responses with:
- ## Headers for main topics
- ### Sub-headers for specific sections
- **Bold text** for important points
- - Bullet points for lists
- 1. Numbered lists for step-by-step instructions
- > Blockquotes for important warnings or tips

User question: ${message}`;

    const response = await cohere.chat({
      model: "command-r",
      message: enhancedMessage,
      temperature: 0.7,
    });
    return response.text.trim();
  } catch (error) {
    console.error("❌ Cohere API error:", error);
    return "⚠️ Error connecting to AI server.";
  }
};

// Helper function to generate suggested questions using Cohere
const generateSuggestedQuestions = async () => {
  try {
    const prompt = `Generate exactly 12 unique agricultural questions that would be relevant for farmers in Malawi. 
    The questions should cover various aspects of farming including:
    - Crop planting and timing (maize, tobacco, groundnuts, soybean, cotton, cassava, sweet potato, rice, beans)
    - Pest and disease management (especially fall armyworm, bollworm)
    - Fertilizer and soil management
    - Irrigation and water management
    - Weather and climate considerations
    - Post-harvest storage and processing
    - Sustainable farming practices

    Return only the questions, one per line, without numbering or bullet points.
    Make the questions practical and actionable for smallholder farmers in Malawi.`;

    const response = await cohere.chat({
      model: "command-r",
      message: prompt,
      temperature: 0.8,
    });

    const questionsText = response.text.trim();
    const questionsArray = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.match(/^\d+[\.\)]/)) // Remove numbered lines
      .slice(0, 12); // Ensure we have exactly 12 questions

    return questionsArray;
  } catch (error) {
    console.error("❌ Error generating suggested questions:", error);
    // Fallback questions if API fails
    return [
      "What is the best time to plant maize in Malawi?",
      "How can I protect my crops from fall armyworm?",
      "What fertilizers work best for groundnuts in sandy soil?",
      "How much water does tobacco need during dry season?",
      "When should I harvest my maize for best yield?",
      "How to prepare soil for cassava planting?",
      "What are signs of nutrient deficiency in soybeans?",
      "How to manage cotton bollworm naturally?",
      "Best irrigation schedule for beans in dry season?",
      "How to store maize properly after harvest?",
      "What spacing is best for sweet potato ridges?",
      "How to control weeds in rice fields organically?"
    ];
  }
};

// Helper function to get cached questions or generate new ones
const getCachedQuestions = async () => {
  return new Promise((resolve, reject) => {
    // Check for cached questions from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    db.get(
      "SELECT questions FROM suggested_questions_cache WHERE created_at > ? ORDER BY created_at DESC LIMIT 1",
      [twentyFourHoursAgo],
      async (err, row) => {
        if (err) {
          console.error("Database error:", err);
          reject(err);
          return;
        }

        if (row) {
          // Return cached questions
          resolve(JSON.parse(row.questions));
        } else {
          // Generate new questions and cache them
          try {
            const newQuestions = await generateSuggestedQuestions();
            
            // Store in cache
            db.run(
              "INSERT INTO suggested_questions_cache (questions) VALUES (?)",
              [JSON.stringify(newQuestions)],
              (err) => {
                if (err) {
                  console.error("Error caching questions:", err);
                }
              }
            );
            
            // Clean old cache entries (keep only last 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            db.run("DELETE FROM suggested_questions_cache WHERE created_at < ?", [sevenDaysAgo]);
            
            resolve(newQuestions);
          } catch (error) {
            reject(error);
          }
        }
      }
    );
  });
};

// Helper function to get base yield for crops (tons per hectare)
const getBaseYield = (cropType) => {
  const baseYields = {
    'Maize': 3.5,
    'Tobacco': 2.0,
    'Groundnuts': 1.5,
    'Soybean': 2.0,
    'Cotton': 1.2,
    'Cassava': 8.0,
    'Sweet Potato': 6.0,
    'Rice': 4.0,
    'Beans': 1.2
  };
  return baseYields[cropType] || 2.0;
};

// Helper function to calculate yield factors based on field conditions
const calculateYieldFactors = (fieldData, weatherData) => {
  let factors = {
    soilType: 1.0,
    fertilizer: 1.0,
    irrigation: 1.0,
    weather: 1.0,
    timing: 1.0
  };
  
  let confidence = 0.8;
  let riskLevel = 'medium';
  
  // Soil type factors
  if (fieldData.soilType === 'Loamy') {
    factors.soilType = 1.2;
  } else if (fieldData.soilType === 'Clay') {
    factors.soilType = 1.1;
  } else if (fieldData.soilType === 'Sandy') {
    factors.soilType = 0.9;
  }
  
  // Fertilizer factors
  if (fieldData.fertilizer === 'Organic') {
    factors.fertilizer = 1.1;
  } else if (fieldData.fertilizer === 'Chemical') {
    factors.fertilizer = 1.3;
  } else if (fieldData.fertilizer === 'Mixed') {
    factors.fertilizer = 1.25;
  } else {
    factors.fertilizer = 0.8; // No fertilizer
  }
  
  // Irrigation factors
  if (fieldData.irrigation === 'Drip') {
    factors.irrigation = 1.3;
  } else if (fieldData.irrigation === 'Sprinkler') {
    factors.irrigation = 1.2;
  } else if (fieldData.irrigation === 'Flood') {
    factors.irrigation = 1.1;
  } else {
    factors.irrigation = 0.85; // Rain-fed
  }
  
  // Weather factors (if available)
  if (weatherData && weatherData.daily) {
    const avgPrecipitation = weatherData.daily.reduce((sum, day) => sum + day.precipitation, 0) / weatherData.daily.length;
    const avgMaxTemp = weatherData.daily.reduce((sum, day) => sum + day.temperature.max, 0) / weatherData.daily.length;
    
    // Optimal precipitation for most crops: 3-5mm per day
    if (avgPrecipitation >= 3 && avgPrecipitation <= 5) {
      factors.weather = 1.1;
    } else if (avgPrecipitation < 1) {
      factors.weather = 0.7;
      riskLevel = 'high';
    } else if (avgPrecipitation > 8) {
      factors.weather = 0.8;
      riskLevel = 'medium-high';
    }
    
    // Temperature considerations (optimal range varies by crop)
    if (avgMaxTemp > 35) {
      factors.weather *= 0.9; // Heat stress
      riskLevel = 'medium-high';
    } else if (avgMaxTemp < 20) {
      factors.weather *= 0.95; // Cool weather
    }
  }
  
  // Timing factors based on planting date
  if (fieldData.plantingDate) {
    const plantingMonth = new Date(fieldData.plantingDate).getMonth();
    // Optimal planting months for Malawi (November-January)
    if (plantingMonth >= 10 || plantingMonth <= 0) {
      factors.timing = 1.1;
    } else if (plantingMonth >= 1 && plantingMonth <= 2) {
      factors.timing = 1.05;
    } else {
      factors.timing = 0.9;
      riskLevel = 'medium-high';
    }
  }
  
  const total = Object.values(factors).reduce((acc, factor) => acc * factor, 1);
  
  // Adjust confidence based on risk level
  if (riskLevel === 'high') confidence = 0.6;
  else if (riskLevel === 'medium-high') confidence = 0.7;
  else if (total > 1.2) confidence = 0.9;
  
  return {
    factors,
    total,
    confidence,
    riskLevel
  };
};

// Helper function to extract recommendations from AI analysis
const extractRecommendations = (aiAnalysis) => {
  // Simple extraction - in production, use more sophisticated NLP
  const recommendations = [];
  const lines = aiAnalysis.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('recommend') || 
        line.toLowerCase().includes('should') || 
        line.toLowerCase().includes('apply') ||
        line.toLowerCase().includes('use')) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
};

// Helper function to determine tip priority
const determinePriority = (tipContent) => {
  const urgentKeywords = ['immediately', 'urgent', 'critical', 'disease', 'pest', 'wilt', 'attack'];
  const highKeywords = ['fertilizer', 'water', 'irrigation', 'harvest', 'planting'];
  const mediumKeywords = ['maintenance', 'monitor', 'check', 'observe'];
  
  const lowerContent = tipContent.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'urgent';
  } else if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  } else if (mediumKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'medium';
  } else {
    return 'low';
  }
};

// Helper function to determine tip category
const determineCategory = (tipContent) => {
  const lowerContent = tipContent.toLowerCase();
  
  if (lowerContent.includes('pest') || lowerContent.includes('disease') || lowerContent.includes('spray')) {
    return 'Pest Control';
  } else if (lowerContent.includes('fertilizer') || lowerContent.includes('nutrient') || lowerContent.includes('compost')) {
    return 'Nutrition';
  } else if (lowerContent.includes('water') || lowerContent.includes('irrigation') || lowerContent.includes('drought')) {
    return 'Water Management';
  } else if (lowerContent.includes('harvest') || lowerContent.includes('storage') || lowerContent.includes('dry')) {
    return 'Harvest';
  } else if (lowerContent.includes('soil') || lowerContent.includes('tillage') || lowerContent.includes('organic matter')) {
    return 'Soil Health';
  } else if (lowerContent.includes('plant') || lowerContent.includes('seed') || lowerContent.includes('sowing')) {
    return 'Planting';
  } else {
    return 'General';
  }
};

// Helper function to get due dates for weekly tips
const getWeeklyDueDate = (index) => {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + index + 1); // Spread tips across the week
  return dueDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

// Helper function to generate crop-specific insights
const generateCropInsights = async (fields) => {
  const cropTypes = [...new Set(fields.map(f => f.cropType))];
  const insights = [];
  
  for (const crop of cropTypes) {
    const fieldsWithCrop = fields.filter(f => f.cropType === crop);
    const totalArea = fieldsWithCrop.reduce((sum, field) => sum + (parseFloat(field.size) || 0), 0);
    
    // Generate crop-specific insight based on current season and crop type
    const insight = {
      crop,
      totalArea,
      fieldCount: fieldsWithCrop.length,
      keyActions: getCropSpecificActions(crop),
      riskFactors: getCropRiskFactors(crop),
      expectedHarvest: calculateExpectedHarvest(crop, fieldsWithCrop)
    };
    
    insights.push(insight);
  }
  
  return insights;
};

// Helper function to get crop-specific actions
const getCropSpecificActions = (crop) => {
  const cropActions = {
    'Maize': ['Monitor for fall armyworm', 'Side-dress with nitrogen', 'Check for stalk borers'],
    'Tobacco': ['Sucker removal', 'Monitor for blue mold', 'Check leaf quality'],
    'Groundnuts': ['Monitor for rosette virus', 'Check pod filling', 'Control leaf spot'],
    'Soybean': ['Monitor for rust', 'Check nodulation', 'Control pod borers'],
    'Cotton': ['Monitor for bollworm', 'Side-dress fertilizer', 'Check for aphids'],
    'Cassava': ['Weeding around plants', 'Monitor for mosaic virus', 'Check tuber development'],
    'Sweet Potato': ['Ridge maintenance', 'Monitor for weevils', 'Check vine health'],
    'Rice': ['Water level management', 'Monitor for blast disease', 'Check tillering'],
    'Beans': ['Monitor for bean fly', 'Support climbing varieties', 'Check pod formation']
  };
  
  return cropActions[crop] || ['Monitor plant health', 'Check for pests', 'Maintain soil moisture'];
};

// Helper function to get crop risk factors
const getCropRiskFactors = (crop) => {
  const riskFactors = {
    'Maize': ['Fall armyworm infestation', 'Drought stress', 'Stalk borer damage'],
    'Tobacco': ['Blue mold disease', 'Hail damage', 'Curing barn fires'],
    'Groundnuts': ['Rosette virus', 'Pod rot', 'Aflatoxin contamination'],
    'Soybean': ['Rust disease', 'Pod borer', 'Drought during flowering'],
    'Cotton': ['Bollworm attack', 'Aphid infestation', 'Irregular rainfall'],
    'Cassava': ['Cassava mosaic virus', 'Mealybug infestation', 'Poor storage'],
    'Sweet Potato': ['Sweet potato weevil', 'Virus diseases', 'Storage rot'],
    'Rice': ['Blast disease', 'Poor water management', 'Bird damage'],
    'Beans': ['Bean fly damage', 'Anthracnose disease', 'Drought stress']
  };
  
  return riskFactors[crop] || ['Disease pressure', 'Pest damage', 'Weather stress'];
};

// Helper function to calculate expected harvest
const calculateExpectedHarvest = (crop, fields) => {
  const baseYield = getBaseYield(crop);
  const totalArea = fields.reduce((sum, field) => sum + (parseFloat(field.size) || 0), 0);
  const avgYieldFactor = 0.85; // Conservative estimate
  
  return {
    estimatedYield: Math.round(baseYield * totalArea * avgYieldFactor * 100) / 100,
    unit: 'tons',
    harvestWindow: getHarvestWindow(crop)
  };
};

// Helper function to get harvest window for crops
const getHarvestWindow = (crop) => {
  const harvestWindows = {
    'Maize': 'April - June',
    'Tobacco': 'March - June',
    'Groundnuts': 'April - May',
    'Soybean': 'April - May',
    'Cotton': 'May - July',
    'Cassava': 'Year-round (after 12 months)',
    'Sweet Potato': 'March - June',
    'Rice': 'April - June',
    'Beans': 'March - April'
  };
  
  return harvestWindows[crop] || 'Varies by variety';
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
    
    // Get AI response with image analysis if images are provided
    const aiResponse = await getAIResponseWithImages(message, images);
    
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
  db.all(
    "SELECT * FROM chats ORDER BY updated_at DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch chats" });
      }
      res.json(rows);
    }
  );
});

// Delete a specific chat
app.delete("/api/chat/:chatId", (req, res) => {
  const { chatId } = req.params;
  
  // First delete all messages for this chat
  db.run("DELETE FROM chat_messages WHERE chat_id = ?", [chatId], (err) => {
    if (err) {
      console.error("Database error deleting messages:", err);
      return res.status(500).json({ error: "Failed to delete chat messages" });
    }
    
    // Then delete the chat itself
    db.run("DELETE FROM chats WHERE id = ?", [chatId], function(err) {
      if (err) {
        console.error("Database error deleting chat:", err);
        return res.status(500).json({ error: "Failed to delete chat" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.json({ success: true, message: "Chat deleted successfully" });
    });
  });
});

// Update chat title
app.put("/api/chat/:chatId/title", (req, res) => {
  const { chatId } = req.params;
  const { title } = req.body;
  
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Title is required" });
  }
  
  db.run(
    "UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [title.trim(), chatId],
    function(err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update chat title" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.json({ success: true, message: "Chat title updated successfully" });
    }
  );
});

// Get suggested questions
app.get("/api/suggested-questions", async (req, res) => {
  try {
    const questions = await getCachedQuestions();
    res.json({ questions });
  } catch (error) {
    console.error("Error fetching suggested questions:", error);
    res.status(500).json({ error: "Failed to fetch suggested questions" });
  }
});

// Get weather forecast for specific coordinates (proxied to AI models)
app.get("/api/weather/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    console.log(`🌤️ Proxying weather request to AI models for coordinates: ${latitude}, ${longitude}`);
    
    // Proxy to Django AI models backend
    const aiModelsUrl = process.env.AI_MODELS_URL || 'http://localhost:8000';
    const aiModelsEndpoint = `${aiModelsUrl}/api/weather-forecast/?latitude=${latitude}&longitude=${longitude}`;
    
    const response = await fetch(aiModelsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      console.log('⚠️ AI models weather service unavailable, falling back to direct API');
      return await handleWeatherFallback(latitude, longitude, res);
    }
    
    const aiWeatherData = await response.json();
    
    if (aiWeatherData.success) {
      console.log('✅ Weather data received from AI models');
      
      // Format for frontend compatibility
      const formattedWeather = {
        location: { latitude, longitude },
        daily: formatAIWeatherData(aiWeatherData.weather),
        crop_prediction: aiWeatherData.crop_prediction
      };
      
      res.json(formattedWeather);
    } else {
      throw new Error(aiWeatherData.error || 'AI models returned error');
    }
    
  } catch (error) {
    console.error("🌤️ Weather proxy error:", error.message);
    
    // Fallback to direct Open-Meteo API
    const { lat, lon } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      return await handleWeatherFallback(latitude, longitude, res);
    }
    
    res.status(503).json({ 
      error: "Weather service temporarily unavailable",
      details: "Both AI models and direct weather API failed",
      retryAfter: 30
    });
  }
});

// Get AI weather forecast with crop predictions (3-day forecast)
app.get("/api/ai-weather/:lat/:lon", async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { crop_type = 'maize' } = req.query;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    console.log(`🌱 Getting AI weather forecast for coordinates: ${latitude}, ${longitude}, crop: ${crop_type}`);
    
    // Call Django AI models weather endpoint with crop predictions
    const aiModelsUrl = process.env.AI_MODELS_URL || 'http://localhost:8000';
    const aiModelsEndpoint = `${aiModelsUrl}/api/weather-forecast/?latitude=${latitude}&longitude=${longitude}&crop_type=${crop_type}`;
    
    const response = await fetch(aiModelsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`AI models weather service returned ${response.status}`);
    }
    
    const aiWeatherData = await response.json();
    
    if (aiWeatherData.success) {
      console.log('✅ AI weather forecast received');
      res.json(aiWeatherData);
    } else {
      throw new Error(aiWeatherData.error || 'AI models returned error');
    }
    
  } catch (error) {
    console.error("🌱 AI weather forecast error:", error.message);
    res.status(503).json({ 
      error: "AI weather service temporarily unavailable",
      details: error.message 
    });
  }
});

// Weather fallback function for direct Open-Meteo API
const handleWeatherFallback = async (latitude, longitude, res) => {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weathercode&timezone=Africa/Blantyre&forecast_days=7`;
    
    const fetchWithRetry = async (url, retries = 3, timeout = 10000) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Weather API fallback attempt ${i + 1}/${retries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'AgriTech-AI/1.0 (Agricultural Assistant)',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('✅ Fallback weather data fetched successfully');
          return data;
          
        } catch (error) {
          console.log(`❌ Fallback attempt ${i + 1} failed:`, error.message);
          
          if (i === retries - 1) throw error;
          
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };
    
    const weatherData = await fetchWithRetry(weatherUrl);
    
    if (!weatherData.daily || !weatherData.daily.time) {
      throw new Error('Invalid weather data structure received');
    }
    
    const formattedWeather = {
      location: { latitude, longitude },
      daily: weatherData.daily.time.map((date, index) => ({
        date,
        temperature: {
          max: weatherData.daily.temperature_2m_max[index] || null,
          min: weatherData.daily.temperature_2m_min[index] || null
        },
        precipitation: weatherData.daily.precipitation_sum[index] || 0,
        windSpeed: weatherData.daily.wind_speed_10m_max[index] || null,
        weatherCode: weatherData.daily.weathercode[index] || null
      }))
    };
    
    res.json(formattedWeather);
    
  } catch (error) {
    console.error("❌ Weather fallback failed:", error.message);
    throw error;
  }
};

// Helper function to format AI weather data for frontend compatibility
const formatAIWeatherData = (aiWeatherData) => {
  // Convert AI models weather format to match frontend expectations
  if (!aiWeatherData) return [];
  
  // If AI weather data has a different format, convert it
  // This is a placeholder - adjust based on actual AI models response format
  return [{
    date: new Date().toISOString().split('T')[0],
    temperature: {
      max: aiWeatherData.today_high || 25,
      min: aiWeatherData.today_low || 15
    },
    precipitation: aiWeatherData.precipitation || 0,
    windSpeed: aiWeatherData.wind_speed || 5,
    weatherCode: aiWeatherData.weather_code || 0
  }];
};

// Advanced image analysis endpoint (proxied to AI models)
app.post("/api/analyze-image", upload.array('images'), async (req, res) => {
  try {
    const { crop_type = 'maize' } = req.body;
    const images = req.files;
    
    if (!images || images.length === 0) {
      return res.status(400).json({ error: "No images provided for analysis" });
    }
    
    console.log(`🔬 Analyzing ${images.length} image(s) for crop type: ${crop_type}`);
    
    // Process first image (extend later for multiple images)
    const imageFile = images[0];
    
    // Create FormData to send to Django
    const formData = new FormData();
    const blob = new Blob([imageFile.buffer], { type: imageFile.mimetype });
    formData.append('image', blob, imageFile.originalname);
    formData.append('crop_type', crop_type);
    
    // Proxy to Django AI models backend
    const aiModelsUrl = process.env.AI_MODELS_URL || 'http://localhost:8000';
    const aiModelsEndpoint = `${aiModelsUrl}/api/analyze-image/`;
    
    const response = await fetch(aiModelsEndpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000) // 30 second timeout for image analysis
    });
    
    if (!response.ok) {
      console.log('⚠️ AI models image analysis service unavailable');
      return res.status(503).json({
        error: "Advanced image analysis temporarily unavailable",
        details: "AI models service is not responding",
        fallback_available: false
      });
    }
    
    const analysisResult = await response.json();
    
    if (analysisResult.success) {
      console.log('✅ Image analysis completed successfully');
      
      // Format response for frontend
      const formattedResult = {
        success: true,
        analysis: {
          plant_identification: analysisResult.analysis,
          recommendations: analysisResult.recommendations,
          crop_type: analysisResult.crop_type,
          analysis_type: 'advanced_ai'
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(formattedResult);
    } else {
      throw new Error(analysisResult.error || 'AI analysis failed');
    }
    
  } catch (error) {
    console.error("🔬 Image analysis proxy error:", error.message);
    
    // Provide fallback response
    res.status(503).json({
      error: "Advanced image analysis failed",
      details: error.message,
      fallback_message: "Please try again later or use basic chat for general crop advice"
    });
  }
});

// Health check for AI models integration
app.get("/api/ai-models-health", async (req, res) => {
  try {
    console.log('🏥 Checking AI models service health...');
    
    const aiModelsUrl = process.env.AI_MODELS_URL || 'http://localhost:8000';
    const response = await fetch(`${aiModelsUrl}/api/health/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const healthData = await response.json();
      console.log('✅ AI models service is healthy');
      
      res.json({
        ai_models_status: 'healthy',
        ai_models_services: healthData.services,
        integration_status: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ AI models service is unavailable:', error.message);
    
    res.status(503).json({
      ai_models_status: 'unavailable',
      integration_status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
app.post("/api/crop-yield-prediction", async (req, res) => {
  try {
    const { fieldData, weatherData, historicalYield } = req.body;
    
    // Validate required data
    if (!fieldData || !fieldData.cropType || !fieldData.soilType) {
      return res.status(400).json({ error: "Field data with crop type and soil type required" });
    }
    
    // Create prompt for Cohere AI to analyze crop yield
    const analysisPrompt = `You are an agricultural AI expert analyzing crop yield predictions for a farm in Malawi.

Field Information:
- Crop Type: ${fieldData.cropType}
- Soil Type: ${fieldData.soilType}
- Field Size: ${fieldData.size || 'Not specified'} hectares
- Location: ${fieldData.location || 'Malawi'}
- Planting Date: ${fieldData.plantingDate || 'Not specified'}
- Fertilizer Used: ${fieldData.fertilizer || 'Not specified'}
- Irrigation: ${fieldData.irrigation || 'Not specified'}

${weatherData ? `Weather Forecast:
Recent conditions: ${JSON.stringify(weatherData, null, 2)}` : ''}

${historicalYield ? `Historical Yield Data:
Previous yields: ${JSON.stringify(historicalYield, null, 2)}` : ''}

Please provide a comprehensive analysis including:
1. Predicted yield estimate (be specific with numbers if possible)
2. Key factors affecting yield (positive and negative)
3. Risk assessment (high/medium/low risk factors)
4. Specific recommendations to improve yield
5. Optimal timing for activities (fertilizer application, irrigation, harvest)

Focus on practical advice for smallholder farmers in Malawi. Be specific about local conditions, pests, and best practices.`;

    const response = await cohere.chat({
      model: "command-r",
      message: analysisPrompt,
      temperature: 0.6,
    });

    // Parse AI response to extract structured data
    const aiAnalysis = response.text.trim();
    
    // Generate mock yield prediction data based on field parameters
    const baseYield = getBaseYield(fieldData.cropType);
    const yieldFactors = calculateYieldFactors(fieldData, weatherData);
    const predictedYield = baseYield * yieldFactors.total;
    
    const yieldPrediction = {
      predictedYield: Math.round(predictedYield * 100) / 100,
      confidence: yieldFactors.confidence,
      factors: yieldFactors.factors,
      analysis: aiAnalysis,
      recommendations: extractRecommendations(aiAnalysis),
      riskAssessment: yieldFactors.riskLevel,
      generatedAt: new Date().toISOString()
    };
    
    res.json(yieldPrediction);
  } catch (error) {
    console.error("Error generating crop yield prediction:", error);
    res.status(500).json({ error: "Failed to generate crop yield prediction" });
  }
});

// AI-powered recommendation engine
app.post("/api/recommendations", async (req, res) => {
  try {
    const { fields, preferences, currentSeason } = req.body;
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "Field data array required" });
    }
    
    // Create comprehensive prompt for personalized recommendations
    const recommendationPrompt = `You are AgriMate, an expert agricultural advisor for smallholder farmers in Malawi. 
    Generate 7 personalized weekly tips based on the following farm information:

Farm Portfolio:
${fields.map((field, index) => `
Field ${index + 1}:
- Name: ${field.name}
- Crop: ${field.cropType}
- Soil Type: ${field.soilType}
- Size: ${field.size} hectares
- Planting Date: ${field.plantingDate || 'Not specified'}
- Last Fertilizer: ${field.lastFertilizer || 'Not specified'}
- Irrigation: ${field.irrigation || 'Rain-fed'}
- Location: ${field.location || 'Not specified'}
`).join('')}

Current Season: ${currentSeason || 'Not specified'}
Farmer Preferences: ${preferences ? JSON.stringify(preferences) : 'Not specified'}

Generate exactly 7 practical, actionable tips for this week. Each tip should:
1. Be specific to the crops and conditions mentioned
2. Include timing (when to do it)
3. Be practical for smallholder farmers in Malawi
4. Address different aspects: pest control, nutrition, irrigation, harvesting, soil health, etc.
5. Consider local climate and seasonal patterns

Format each tip as a single paragraph starting with the main action, followed by explanation and timing.
Make tips diverse - don't repeat similar advice.
Focus on immediate actions for the current week.`;

    const response = await cohere.chat({
      model: "command-r",
      message: recommendationPrompt,
      temperature: 0.7,
    });

    // Parse AI response into structured tips
    const aiResponse = response.text.trim();
    const tipParagraphs = aiResponse.split('\n\n').filter(tip => tip.trim().length > 0);
    
    // Convert to structured format
    const weeklyTips = tipParagraphs.slice(0, 7).map((tip, index) => {
      const cleanTip = tip.replace(/^\d+\.\s*/, '').trim(); // Remove numbering
      
      // Extract action (first sentence)
      const sentences = cleanTip.split('. ');
      const action = sentences[0] + (sentences[0].endsWith('.') ? '' : '.');
      const description = sentences.slice(1).join('. ');
      
      // Determine priority and category based on content
      const priority = determinePriority(cleanTip);
      const category = determineCategory(cleanTip);
      
      return {
        id: `tip_${Date.now()}_${index}`,
        action,
        description,
        priority,
        category,
        completed: false,
        dueDate: getWeeklyDueDate(index)
      };
    });
    
    // Generate crop-specific insights
    const cropInsights = await generateCropInsights(fields);
    
    const recommendations = {
      weeklyTips,
      cropInsights,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 week
      farmSummary: {
        totalFields: fields.length,
        primaryCrops: [...new Set(fields.map(f => f.cropType))],
        totalArea: fields.reduce((sum, field) => sum + (parseFloat(field.size) || 0), 0)
      }
    };
    
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});// Get specific chat with messages
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
    
    // Get AI response with image analysis if images are provided
    const aiResponse = await getAIResponseWithImages(message, images);
    
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve frontend for all non-API routes (SPA routing)
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ AgriTech AI server running on http://localhost:${PORT}`)
);
