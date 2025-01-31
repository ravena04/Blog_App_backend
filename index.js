const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const url = "mongodb+srv://Ravena2005:Ravena2005@ravena.9eipe.mongodb.net/";
const dbName = 'BlogApp';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, 
}));

app.use(express.json()); // Parse JSON requests

// Connect to MongoDB
mongoose.connect(url + dbName)
  .then(() => {
    console.log("Connected To MongoDb");
  })
  .catch((err) => {
    console.log("Failed To Connect", err);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Blog schema and model
const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    externalLink: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
});
const Blog = mongoose.model('Blog', BlogSchema);

// Create Blog Route
app.post('/blogs/create', async (req, res) => {
  const { title, content, author, category, externalLink } = req.body;
  if (!title || !content || !author || !category) {
      return res.status(400).json({ message: 'Please fill all the required fields' });
  }
  try {
      const newBlog = new Blog({
          title,
          content,
          author,
          category,
          externalLink,
      });
      await newBlog.save();
      res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
  } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({ message: 'Error creating blog, please try again' });
  }
});

// Get Blogs Route
app.get('/blogs', async (req, res) => {
  try {
      const blogs = await Blog.find();
      res.status(200).json({ blogs });
  } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Error fetching blogs' });
  }
});

// Start server
app.listen(4000, () => {
  console.log('Server started on http://localhost:4000');
});
