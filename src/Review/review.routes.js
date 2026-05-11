'use strict';

import { Router } from 'express';
import { getBranchReviews, deleteReview, getAllReviews } from './review.controller.js'; // 👈 Importas la nueva función
import { validateDeleteReview } from '../../middlewares/review-validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// NUEVA: Ver todas las reseñas (Para el Dashboard Global)
router.get(
    '/',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')],
    getAllReviews
);

// Las que ya tenías...
router.get('/branch/:branchId', [validateJWT], getBranchReviews);

router.patch(
    '/:id/status',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateDeleteReview],
    deleteReview
);

export default router;