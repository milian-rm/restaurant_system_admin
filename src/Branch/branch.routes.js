// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Branch\branch.routes.js
'use strict';

import { Router } from 'express';
import {
    createBranch,
    getBranches,
    updateBranch,
    changeBranchStatus
} from './branch.controller.js';

import {
    validateCreateBranch,
    validateUpdateBranch,
    validateBranchIdParam
} from '../../middlewares/branch-validator.js';

import { uploadBranchImage } from '../../middlewares/file-uploader.js';

// 👇 1. IMPORTAR LOS MIDDLEWARES DE SEGURIDAD 👇
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// GET - Listar: Solo pedimos que esté logueado (validateJWT), cualquier rol puede verlas
router.get(
    '/',
    [validateJWT], 
    getBranches
);

// POST - Crear: Solo el PLATFORM_ADMIN puede crear nuevas sucursales
router.post(
    '/',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'), // 🛡️ Barrera de rol
        uploadBranchImage.single('Photos'),
        validateCreateBranch
    ],
    createBranch
);

// PUT - Actualizar: Pueden editar el PLATFORM_ADMIN y el BRANCH_ADMIN
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), // 🛡️ Barrera de rol múltiple
        uploadBranchImage.single('Photos'),
        validateUpdateBranch
    ],
    updateBranch
);

// PATCH - Estado: Solo el PLATFORM_ADMIN puede activar/desactivar
router.patch(
    '/:id/status',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'), // 🛡️ Barrera de rol
        validateBranchIdParam
    ],
    changeBranchStatus
);

export default router;