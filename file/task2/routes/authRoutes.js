const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'admin').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const exists = await User.findOne({ email: value.email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(value.password, 10);
    const user = await User.create({ ...value, password: hashed });
    res.status(201).json({ message: 'Registered successfully', id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(value.password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) { next(err); }
});

router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) { next(err); }
});

router.get('/students', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    res.status(200).json(await User.find({ role: 'student' }).select('-password'));
  } catch (err) { next(err); }
});

module.exports = router;
