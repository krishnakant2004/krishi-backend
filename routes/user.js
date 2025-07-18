const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, message: "Users retrieved successfully.", data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// login
router.post('/login', async (req, res) => {
    const { phoneNo, password } = req.body;
    console.log(req.body);

    try {
        // Check if the user exists
        const user = await User.findOne({ phoneNo:phoneNo });
        console.log(req.body);

        if (!user) {
            return res.status(401).json({ success: false, message: "user not found with this number." });
        }

        // If user has no password, they must use Google Sign-In
        if (!user.password) {
            return res.status(401).json({ success: false, message: "Account was created with Google. Please sign in with Google." });
        }

        // Check if the password is correct
        // SECURITY WARNING: You are storing passwords in plain text.
        // In a real application, you MUST hash passwords using a library like `bcrypt`.
        // Example: const isMatch = await bcrypt.compare(password, user.password);
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

        // Create a JWT for the user session
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        // Don't send the password back to the client
        user.password = undefined;

        // Authentication successful
        res.status(200).json({ success: true, message: "Login successful.", data: { token, user } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// Get a user by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User retrieved successfully.", data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new user
router.post('/register', asyncHandler(async (req, res) => {
    console.log("server is ready to request");
    console.log(req.body);
    const {name, email, BuisnessName, password, phoneNo} = req.body;
    if (!name || !password || !email) {
        return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    // Check if a user with this email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    // SECURITY WARNING: Passwords should be hashed before saving!
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    // const user = new User({ name, email, password: hashedPassword, ... });

    // Check if the user exists with this number
    const userNumber = await User.findOne({ phoneNo:phoneNo });
    console.log(userNumber);
    if (userNumber) {
        return res.status(401).json({ success: false, message: "user already exist with this number try with another number" });
    }

    // Check if the user exists with this userName
    const userName = await User.findOne({ BuisnessName:BuisnessName });
    console.log(userName);
    if (userName) {
        return res.status(401).json({ success: false, message: "user already exist with this userName  try with another userName" });
    }

    try {
        const user = new User({ name, email, BuisnessName, password, phoneNo });
        const newUser = await user.save();
        res.json({ success: true, message: "User created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Google Auth Endpoint
router.post('/google-auth', asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: "idToken is required for Google authentication." });
    }

    try {
        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        // Find or create the user in the database
        let user = await User.findOne({ email: email });

        if (!user) {
            // User doesn't exist, create a new one
            user = await User.create({ googleId, email, name, avatar });
        } else {
            // User exists, ensure googleId and avatar are linked
            if (!user.googleId) user.googleId = googleId;
            if (!user.avatar) user.avatar = avatar; // Only set avatar if they don't have one
            await user.save();
        }

        // Create our own JWT for the session
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        user.password = undefined; // Never send password back

        res.json({ success: true, message: 'Google authentication successful.', data: { token, user } });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, message: "Invalid Google token or authentication failed." });
    }
}));

// Update a user
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { name,BuisnessName ,password,phoneNo } = req.body;
        if (!name || !password ||!BuisnessName || !phoneNo) {
            return res.status(400).json({ success: false, message: "Name,  and password are required." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            {  name,BuisnessName,password ,phoneNo },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
