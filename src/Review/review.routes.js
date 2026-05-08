'use strict';

import { Router } from 'express';
import { getBranchReviews, deleteReview } from './review.controller.js';
import { validateDeleteReview } from '../../middlewares/review-validator.js';

// IMPORTAR SEGURIDAD
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/**
 * GET - Ver reseñas por sucursal
 * Cualquier usuario autenticado puede ver el feedback
 */
router.get(
    '/branch/:branchId',
    [validateJWT], 
    getBranchReviews
);

/**
 * PATCH - Soft Delete / Moderación
 * Solo administradores (Plataforma o Sucursal) pueden ocultar reseñas
 */
router.patch(
    '/:id/status',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'),
        validateDeleteReview
    ],
    deleteReview
);

export default router;