// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\additionalService\additionalService.routes.js
'use strict';

import { Router } from 'express';
import {
    getAdditionalServices,
    createAdditionalService,
    updateAdditionalService,
    changeAdditionalServiceStatus
} from './additionalService.controller.js';

import {
    validateCreateAdditionalService,
    validateUpdateAdditionalService,
    validateAdditionalServiceStatusChange
} from '../../middlewares/additionalService-validator.js';

// 👇 1. IMPORTAR MIDDLEWARES DE SEGURIDAD 👇
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/**
 * GET - Listar
 * Cualquier usuario logueado puede ver qué servicios adicionales ofrecemos
 */
router.get(
    '/', 
    [validateJWT], 
    getAdditionalServices
);

/**
 * POST - Crear
 * Solo el Administrador de Plataforma puede dar de alta nuevos servicios
 */
router.post(
    '/',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'),
        validateCreateAdditionalService
    ],
    createAdditionalService
);

/**
 * PUT - Actualizar
 * Solo el Administrador de Plataforma puede editar precios o nombres de servicios
 */
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'),
        validateUpdateAdditionalService
    ],
    updateAdditionalService
);

/**
 * PATCH - Estado (Borrado Lógico)
 * Solo el Administrador de Plataforma puede activar o desactivar servicios
 */
router.patch(
    '/:id/status',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'),
        validateAdditionalServiceStatusChange
    ],
    changeAdditionalServiceStatus
);

export default router;