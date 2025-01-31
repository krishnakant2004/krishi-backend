const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');

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
        console.log(user);


        if (!user) {
            return res.status(401).json({ success: false, message: "user not found with this number." });
        }
        // Check if the password is correct
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

        // Authentication successful
        res.status(200).json({ success: true, message: "Login successful.",data: user });
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
    const {name,BuisnessName ,password,phoneNo} = req.body;
    if (!name || !password) {
        return res.status(400).json({ success: false, message: "Name, and password are required." });
    }

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
        const user = new User({ name,BuisnessName ,password,phoneNo });
        const newUser = await user.save();
        res.json({ success: true, message: "User created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
