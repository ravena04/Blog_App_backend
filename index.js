const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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



// User Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(200).json({ message: "Signed up successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sign up failed" });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

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
app.get('/myblogs/:author', async (req, res) => {
  const { author } = req.params;

  try {
      const blogs = await Blog.find({ author });

      if (blogs.length === 0) {
          return res.status(404).json({ message: "No blogs found for this author." });
      }

      res.status(200).json({ blogs });
  } catch (error) {
      console.error('Error fetching author blogs:', error);
      res.status(500).json({ message: 'Error fetching blogs' });
  }
});
// Delete Blog Route
app.delete('/blogs/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Error deleting blog, please try again' });
  }
});
// Update Blog Route
app.put('/blogs/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, author, category, externalLink } = req.body;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, content, author, category, externalLink },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: 'Error updating blog, please try again' });
  }
});
// Comment schema and model
const CommentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model('Comment', CommentSchema);

// Route to get comments for a blog
app.get('/blogs/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Route to add a comment to a blog
app.post('/blogs/:id/comments', async (req, res) => {
  const { author, content } = req.body;
  try {
    const newComment = new Comment({
      blogId: req.params.id,
      author,
      content,
    });
    await newComment.save();
    res.status(200).json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Route to delete a comment
app.delete('/comments/:id', async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// Like and Dislike Routes
let blogLikes = {}; 

// Like a blog
app.post('/blogs/:id/like', async (req, res) => {
  try {
    const blogId = req.params.id;
    if (!blogLikes[blogId]) {
      blogLikes[blogId] = { likes: 0, dislikes: 0 };
    }
    blogLikes[blogId].likes += 1;
    res.status(200).json({ message: 'Liked the blog' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to like the blog' });
  }
});

// Dislike a blog
app.post('/blogs/:id/dislike', async (req, res) => {
  try {
    const blogId = req.params.id;
    if (!blogLikes[blogId]) {
      blogLikes[blogId] = { likes: 0, dislikes: 0 };
    }
    blogLikes[blogId].dislikes += 1;
    res.status(200).json({ message: 'Disliked the blog' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to dislike the blog' });
  }
});

// Get like/dislike counts for a blog
app.get('/blogs/:id/likes', (req, res) => {
  try {
    const blogId = req.params.id;
    const likeData = blogLikes[blogId] || { likes: 0, dislikes: 0 };
    res.status(200).json(likeData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch like data' });
  }
});






// Start server
app.listen(4000, () => {
  console.log('Server started on http://localhost:4000');
});
