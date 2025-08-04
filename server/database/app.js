const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3030;

// --- Middleware Setup ---
// Use built-in express middleware for parsing JSON and URL-encoded bodies.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Mongoose Models ---
const Reviews = require('./review');
const Dealerships = require('./dealership');

// --- Database Connection and Initialization ---
const MONGO_URI = "mongodb://mongo_db:27017/dealershipsDB";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Initialize data after successful connection
    initializeDatabase();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Function to clear and populate the database from JSON files
const initializeDatabase = async () => {
  try {
    // Clear existing data
    await Reviews.deleteMany({});
    await Dealerships.deleteMany({});
    console.log("Cleared existing data from Reviews and Dealerships collections.");

    // Read data from files
    const reviews_data = JSON.parse(fs.readFileSync("reviews.json", 'utf8'));
    const dealerships_data = JSON.parse(fs.readFileSync("dealerships.json", 'utf8'));

    // Insert new data
    await Reviews.insertMany(reviews_data.reviews);
    await Dealerships.insertMany(dealerships_data.dealerships);
    console.log("Database has been initialized with data from JSON files.");

  } catch (error) {
    console.error('Error initializing database:', error);
  }
};


// --- API Routes ---

// Root endpoint
app.get('/', (req, res) => {
    res.send("Welcome to the Mongoose API");
});

// Fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Fetch reviews by dealer id
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({ dealership: req.params.id });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews by dealer id' });
  }
});

// Fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealerships" });
  }
});

// Fetch dealers by state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({ state: req.params.state });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealerships by state" });
  }
});

// Fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    // Use findOne since `id` should be unique
    const document = await Dealerships.findOne({ id: req.params.id });
    if (document) {
      res.json(document);
    } else {
      res.status(404).json({ error: "Dealer not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching dealer by id" });
  }
});

// Insert a new review
app.post('/insert_review', async (req, res) => {
  // Check if request body exists
  if (!req.body) {
    return res.status(400).json({ error: 'Review data is missing' });
  }

  try {
    // Find the review with the highest id to determine the next id
    const lastReview = await Reviews.findOne().sort({ id: -1 });
    const new_id = lastReview ? lastReview.id + 1 : 1;

    // Create a new review instance with data from the request body
    const newReview = new Reviews({
      ...req.body, // Use spread syntax for cleaner assignment
      id: new_id,
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview); // Use 201 Created status for new resources
  } catch (error) {
    console.error("Error inserting review:", error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
