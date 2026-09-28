const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const config = require('../config/config');

class AuthController {
    static async register(req, res, next) {
        try {
            const { username, email, password } = req.body;

            // Check if user already exists
            const existing = await UserModel.findByEmail(email);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Create user
            const user = await UserModel.create({
                username,
                email,
                password_hash,
                role: 'user'
            });

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username, role: user.role },
                config.JWT.SECRET,
                { expiresIn: config.JWT.EXPIRES_IN }
            );

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            next(err);
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username, role: user.role },
                config.JWT.SECRET,
                { expiresIn: config.JWT.EXPIRES_IN }
            );

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMe(req, res, next) {
        try {
            const user = await UserModel.findById(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            res.status(200).json({
                success: true,
                user
            });
        } catch (err) {
            next(err);
        }
    }

    static async logout(req, res) {
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

module.exports = AuthController;
