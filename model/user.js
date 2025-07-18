const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    sparse:true,
    lowercase: true
  },
  avatar: { type: String }, // URL to profile picture from Google
  googleId: { type: String, unique: true, sparse: true },
  BuisnessName:{
    type:String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  password: { // Optional for Google Sign-In users
    type: String,
  },
  phoneNo:{
    type:String,
    unique: true,
    sparse: true // Allows multiple null values
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;