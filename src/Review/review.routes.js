'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
    getBranchReviews,
    deleteReview
} from './review.controller.js';

import {
    validateDeleteReview
} from '../../middlewares/review-validator.js';

const router = Router();

/* =========================================
   PERSONAL / ADMIN
========================================= */

// Ver reseñas por sucursal
router.get(
    '/branch/:branchId',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    getBranchReviews
);

// Soft Delete (PATCH) - solo admins (según tu lógica actual)
router.patch(
    '/:id/status',
    validateJWT,
    hasRole('BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    validateDeleteReview,
    deleteReview
);

export default router;