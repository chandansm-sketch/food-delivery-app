import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Mock OTP logic for +91 numbers
// In a real app, integrate Twilio or Fast2SMS here

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretfooddeliveryjwt', {
        expiresIn: '30d',
    });
};

export const requestOTP = async (req, res) => {
    const { phone, role, name } = req.body;

    if (!phone || !phone.startsWith('+91')) {
        return res.status(400).json({ message: 'Valid Indian phone number starting with +91 is required' });
    }

    try {
        let user = await User.findOne({ phone });

        if (!user) {
            if (!name || !role) {
                return res.status(400).json({ message: 'Name and Role are required for new registration' });
            }
            user = await User.create({
                name,
                phone,
                role
            });
        } else if (role && user.role !== role) {
            // Optional: User might want to login with a different role which we don't allow for simplicity, 
            // but let's just warn them
            return res.status(400).json({ message: `User already exists with role: ${user.role}` });
        }

        // Generate mock OTP
        const otp = '123456';
        console.log(`[MOCK OTP] Sent OTP ${otp} to phone ${phone}`);

        res.status(200).json({ message: 'OTP sent successfully (Mock)', phone });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    if (otp !== '123456') {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
