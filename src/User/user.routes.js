// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\User\user.routes.js
import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    getProfile,
    changeUserStatus
} from './user.controller.js';

import {
    validateCreateUser,
    validateUpdateUserRequest,
    validateUserStatusChange,
    validateGetUserById
} from '../../middlewares/user-validator.js';

// 👇 1. IMPORTAR SEGURIDAD 👇
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/**
 * GET - Listar usuarios
 * Solo administradores pueden ver la lista completa de personal.
 */
router.get(
    '/', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], 
    getUsers
);

/**
 * GET - Perfil
 * Aunque tu controlador actual dice que requiere Auth, 
 * le ponemos el middleware para que no truene.
 */
router.get(
    '/profile', 
    [validateJWT], 
    getProfile
);

/**
 * GET - Usuario por ID
 */
router.get(
    '/:id',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateGetUserById],
    getUserById
);

/**
 * POST - Crear usuario (Empleado/Admin)
 * Solo el PLATFORM_ADMIN debería poder crear otros administradores.
 */
router.post(
    '/',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), 
        validateCreateUser
    ],
    createUser
);

/**
 * PUT - Actualizar usuario
 */
router.put(
    '/:id',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), 
        validateUpdateUserRequest
    ],
    updateUser
);

/**
 * PATCH - Estado del usuario (Activar/Desactivar)
 */
router.patch(
    '/:id/status',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN'), 
        validateUserStatusChange
    ],
    changeUserStatus
);

export default router;