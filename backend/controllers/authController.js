const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Captain = require('../models/Captain');
const { generateToken } = require('../utils/jwtUtils');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

// ----------------------------
// User Registration
// ----------------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, msg: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existingUser) {
      return res.status(409).json({ success: false, msg: 'Email or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword
    });

    await user.save();

    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateToken({ id: user._id });

    return res.status(201).json({
      success: true,
      msg: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'user'
      },
      accessToken,
      refreshToken,
      token: accessToken
    });
  } catch (err) {
    console.error('Error in registerUser:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ----------------------------
// User Login
// ----------------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    const accessToken = generateToken({ id: user._id });
    const refreshToken = generateToken({ id: user._id });

    return res.status(200).json({
      success: true,
      msg: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'user'
      },
      accessToken,
      refreshToken,
      token: accessToken
    });
  } catch (err) {
    console.error('Error in loginUser:', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

// ----------------------------
// Captain Registration
// ----------------------------
exports.registerCaptain = async (req, res) => {
  try {
    const { fullName, email, phone, licenseNumber, password } = req.body;
    if (!fullName || !email || !phone || !licenseNumber || !password) {
      return res.status(400).json({ success: false, msg: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const existingCaptain = await Captain.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existingCaptain) {
      return res.status(409).json({ success: false, msg: 'Email or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const captain = new Captain({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      licenseNumber: licenseNumber.trim(),
      password: hashedPassword
    });

    await captain.save();

    const accessToken = generateToken({ id: captain._id });
    const refreshToken = generateToken({ id: captain._id });

    return res.status(201).json({
      success: true,
      msg: 'Captain registered successfully',
      captain: {
        id: captain._id,
        fullName: captain.fullName,
        email: captain.email,
        phone: captain.phone,
        licenseNumber: captain.licenseNumber,
        role: 'captain'
      },
      accessToken,
      refreshToken,
      token: accessToken
    });
  } catch (err) {
    console.error('Error in registerCaptain:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ----------------------------
// Captain Login
// ----------------------------
exports.loginCaptain = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const captain = await Captain.findOne({ email: normalizedEmail }).select('+password');

    if (!captain || !(await bcrypt.compare(password, captain.password))) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    const accessToken = generateToken({ id: captain._id });
    const refreshToken = generateToken({ id: captain._id });

    return res.status(200).json({
      success: true,
      msg: 'Login successful',
      captain: {
        id: captain._id,
        fullName: captain.fullName,
        email: captain.email,
        phone: captain.phone,
        licenseNumber: captain.licenseNumber,
        role: 'captain'
      },
      accessToken,
      refreshToken,
      token: accessToken
    });
  } catch (err) {
    console.error('Error in loginCaptain:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ----------------------------
// Get Current User / Captain Profile
// ----------------------------
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, msg: 'Not authenticated' });

    const model = req.role === 'captain' ? Captain : User;
    const account = await model.findById(req.user._id).select('-password');

    if (!account) return res.status(404).json({ success: false, msg: 'Account not found' });

    return res.status(200).json({ success: true, data: account });
  } catch (err) {
    console.error('Error in getProfile:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ----------------------------
// Change Password
// ----------------------------
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, msg: 'Old and new passwords are required' });
    }

    const model = req.role === 'captain' ? Captain : User;
    const account = await model.findById(req.user._id).select('+password');

    if (!account) return res.status(404).json({ success: false, msg: 'Account not found' });

    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) return res.status(401).json({ success: false, msg: 'Old password incorrect' });

    account.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await account.save();

    return res.status(200).json({ success: true, msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Error in changePassword:', err);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

// ----------------------------
// Logout
// ----------------------------
exports.logout = (req, res) => {
  return res.status(200).json({ success: true, msg: 'Logged out successfully' });
};
