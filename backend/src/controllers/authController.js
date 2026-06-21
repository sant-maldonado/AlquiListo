import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

export const AuthController = {
  async register(req, res) {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'password debe tener al menos 6 caracteres' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const validRoles = ['inquilino', 'propietario'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'role debe ser inquilino o propietario' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ email, password_hash, role });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('register error:', err);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('login error:', err);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async me(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'No autenticado' });

      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      console.error('me error:', err);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  },
};
