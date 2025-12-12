
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('ecoMart'); // Connect to ecoMart database
    console.log('✅ Connected to MongoDB Atlas!');
    console.log(`📊 Database: ecoMart`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit if database connection fails
  }
}

// MIDDLEWARE
// ============================================

// Enable CORS (allows frontend to connect)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Logger middleware - logs all requests with more details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log request body for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});


app.use('/images', express.static('public/images', {
  // Custom error handler for missing files
  setHeaders: (res, path) => {
    console.log(`📸 Serving image: ${path}`);
  }
}));

// Custom 404 handler for images
app.use('/images', (req, res) => {
  console.log(`❌ Image not found: ${req.url}`);
  res.status(404).json({ 
    error: 'Image not found',
    path: req.url,
    message: 'The requested image does not exist on the server'
  });
});


// API ROUTES


// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ecoMART API!', 
    status: 'Server is running 🚀',
    database: 'Connected to MongoDB ✅',
    endpoints: {
      lessons: 'GET /api/lessons',
      orders: 'POST /api/orders',
      updateLesson: 'PUT /api/lessons/:id'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: db ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString() 
  });
});

// GET /api/lessons - Retrieve all lessons
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// GET /api/search - Search for lessons
// Example: /api/search?q=chess
app.get('/api/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    // Validate search query
    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required',
        message: 'Please provide a search term using ?q=yourquery'
      });
    }
    
    // Search in MongoDB using regex (case-insensitive)
    // Searches in: subject, location, price, and spaces
    const lessons = await db.collection('lessons').find({
      $or: [
        { subject: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { price: isNaN(searchQuery) ? null : parseInt(searchQuery) },
        { spaces: isNaN(searchQuery) ? null : parseInt(searchQuery) }
      ]
    }).toArray();
    
    console.log(`🔍 Search query: "${searchQuery}" - Found ${lessons.length} results`);
    
    res.json({
      query: searchQuery,
      count: lessons.length,
      results: lessons
    });
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({ error: 'Failed to search lessons' });
  }
});

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const order = req.body;
    
    // Add timestamp to order
    order.createdAt = new Date();
    
    const result = await db.collection('orders').insertOne(order);
    
    res.status(201).json({ 
      message: 'Order created successfully',
      orderId: result.insertedId 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/lessons/:id - Update lesson spaces
app.put('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { spaces } = req.body;
    
    // Validate that spaces is a number
    if (typeof spaces !== 'number') {
      return res.status(400).json({ error: 'Spaces must be a number' });
    }
    
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(id) },
      { $set: { spaces: spaces } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json({ 
      message: 'Lesson spaces updated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// ============================================
// START SERVER
// ============================================

// Connect to database first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 ecoMART Backend Server`);
    console.log(`📡 Running on: http://localhost:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('=================================');
  });
});
