const { z } = require('zod');
const authService = require('../services/auth.service');
const { validate } = require('../middlewares/validate');

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const register = [
  validate({ body: registerSchema }),
  async (req, res) => {
    const data = await authService.register(req.body);
    res.status(201).json({ message: 'Registered', data });
  },
];

const login = [
  validate({ body: loginSchema }),
  async (req, res) => {
    const data = await authService.login(req.body);
    res.json({ message: 'Logged in', data });
  },
];

module.exports = { register, login };
