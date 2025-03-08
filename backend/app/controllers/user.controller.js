// user.controller.js
const db = require('../models');
const User = db.User;

exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};
