// seedDB.js - Script to insert lesson data into MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Lesson data from products.js
const lessons = [
  { id: 1, subject: "Chess", location: "Dubai", price: 50, spaces: 10, image: "images/products/chess.jpg" },
  { id: 2, subject: "CyberSecurity", location: "Abu Dhabi", price: 40, spaces: 10, image: "images/products/cyberSecurity.jpg" },
  { id: 3, subject: "Drama", location: "Sharjah", price: 60, spaces: 10, image: "images/products/drama.jpg" },
  { id: 4, subject: "eSports and Gaming", location: "Dubai", price: 45, spaces: 10, image: "images/products/esports.png" },
  { id: 5, subject: "Football", location: "Abu Dhabi", price: 70, spaces: 10, image: "images/products/football.jpg" },
  { id: 6, subject: "Game Development", location: "Sharjah", price: 30, spaces: 10, image: "images/products/gameDev.jpg"},
  { id: 7, subject: "Karaoke", location: "Dubai", price: 55, spaces: 10, image: "images/products/karaoke.jpg" },
  { id: 8, subject: "Kong Fu", location: "Abu Dhabi", price: 35, spaces: 10, image: "images/products/kongFu.jpg" },
  { id: 9, subject: "Maths Club", location: "Sharjah", price: 40, spaces: 10, image: "images/products/maths.jpg" },
  { id: 10, subject: "Robotics and Coding", location: "Dubai", price: 65, spaces: 10, image: "images/products/robotics.jpg" },
  { id: 11, subject: "Science", location: "Abu Dhabi", price: 50, spaces: 10, image: "images/products/science.jpg" },
  { id: 12, subject: "Tai Jutsu", location: "Sharjah", price: 45, spaces: 10, image: "images/products/taijutsu.jpg" }
];

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ecoMart');
    const lessonsCollection = db.collection('lessons');
    
    // Check if lessons already exist
    const existingCount = await lessonsCollection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing lessons in database`);
      console.log('   Do you want to:');
      console.log('   1. Delete existing and insert new data');
      console.log('   2. Keep existing data');
      console.log('');
      console.log('   To delete existing data, run: node seedDB.js --force');
      
      // Check if --force flag is provided
      if (!process.argv.includes('--force')) {
        console.log('');
        console.log('❌ Seeding cancelled. Use --force flag to override.');
        return;
      }
      
      // Delete existing lessons
      await lessonsCollection.deleteMany({});
      console.log('🗑️  Deleted existing lessons');
    }
    
    // Insert lessons
    const result = await lessonsCollection.insertMany(lessons);
    
    console.log('');
    console.log('=================================');
    console.log('✅ Database seeded successfully!');
    console.log(`📚 Inserted ${result.insertedCount} lessons`);
    console.log('=================================');
    console.log('');
    console.log('Lessons added:');
    lessons.forEach(lesson => {
      console.log(`  - ${lesson.subject} (${lesson.location}) - $${lesson.price}`);
    });
    console.log('');
    console.log(' You can now test your API at: http://localhost:3000/api/lessons');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('');
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();