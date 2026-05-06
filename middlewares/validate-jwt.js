// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\middlewares\validate-jwt.js
'use strict';

import jwt from 'jsonwebtoken';

export const validateJWT = async (req, res, next) => {
    try {
        // 1. Obtener token
        const token =
            req.header('x-token') ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó un token',
                error: 'MISSING_TOKEN',
            });
        }

        // 2. Verificar token
        // El SECRET_KEY debe ser el mismo que usa el Auth-Service de C#
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        // Extraemos el ID y el Role que vienen inyectados desde C#
        const userId = decoded.uid || decoded.sub || decoded.id;
        const userRole = decoded.role || 'CLIENT';

        // 3. Adjuntamos los datos al objeto request
        // Saltamos la búsqueda en MongoDB porque los IDs de C# (usr_...) 
        // rompen el formato de ObjectId de Mongo.
        req.user = {
            id: userId,
            role: userRole
        };

        next();

    } catch (error) {
        console.error('Error de validación JWT:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El token ha expirado',
                error: 'TOKEN_EXPIRED',
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o malformado',
                error: 'INVALID_TOKEN',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al validar el token',
            error: 'TOKEN_VALIDATION_ERROR',
        });
    }
};