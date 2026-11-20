const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  author: { type: String, required: [true, 'Author is required'] },
  price: { type: Number, min: [1, 'Price must be at least 1'] },
  category: { type: String },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Book', bookSchema);
