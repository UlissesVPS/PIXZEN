"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class AuthService {
    async signUp(email, password, name) {
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('Email ja cadastrado');
        }
        if (password.length < 8) {
            throw new Error('Senha deve ter no minimo 8 caracteres');
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            throw new Error('Senha deve conter letras maiusculas, minusculas e numeros');
        }
        const password_hash = await bcrypt_1.default.hash(password, 12);
        const isAdmin = email === env_1.config.admin.email;
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password_hash,
                name,
                is_admin: isAdmin,
                profile: {
                    create: { nome: name },
                },
                assinante: {
                    create: {
                        status: 'trial',
                        plano: 'trial',
                        data_expiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
            },
            include: {
                profile: true,
                assinante: true,
            },
        });
        const token = this.generateToken(user);
        logger_1.logger.success(`Novo usuario cadastrado: ${email}`);
        return { user: this.sanitizeUser(user), token };
    }
    async signIn(email, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { profile: true, assinante: true },
        });
        if (!user) {
            throw new Error('Credenciais invalidas');
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            throw new Error('Credenciais invalidas');
        }
        const token = this.generateToken(user);
        logger_1.logger.info(`Login: ${email}`);
        return { user: this.sanitizeUser(user), token };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('Usuario nao encontrado');
        }
        const validPassword = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            throw new Error('Senha atual incorreta');
        }
        if (newPassword.length < 8) {
            throw new Error('Nova senha deve ter no minimo 8 caracteres');
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            throw new Error('Senha deve conter letras maiusculas, minusculas e numeros');
        }
        const password_hash = await bcrypt_1.default.hash(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password_hash },
        });
        logger_1.logger.info(`Senha alterada: userId=${userId}`);
    }
    async getMe(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { profile: true, assinante: true },
        });
        if (!user) {
            throw new Error('Usuario nao encontrado');
        }
        return this.sanitizeUser(user);
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin,
        };
        // Use raw expiresIn value (e.g., '7d') - cast needed for jsonwebtoken types
        const expiresInMs = env_1.config.jwt.expiresIn;
        return jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, {
            expiresIn: expiresInMs,
        });
    }
    sanitizeUser(user) {
        const { password_hash, ...safe } = user;
        return safe;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.js.map