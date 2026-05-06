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

import { uploadAdditionalServiceImage } from '../../middlewares/file-uploader.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/**
 * GET - Listar
 */
router.get(
    '/', 
    [validateJWT], 
    getAdditionalServices
);

/**
 * POST - Crear
 * Orden: Validar Token -> Validar Rol -> Subir Imagen -> Validar Campos -> Controlador
 */
router.post(
    '/',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'),
        uploadAdditionalServiceImage.single('image'),
        validateCreateAdditionalService
    ],
    createAdditionalService
);

/**
 * PUT - Actualizar
 */
router.put(
    '/:id',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN'),
        uploadAdditionalServiceImage.single('image'),
        validateUpdateAdditionalService
    ],
    updateAdditionalService
);

/**
 * PATCH - Estado (Borrado Lógico)
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