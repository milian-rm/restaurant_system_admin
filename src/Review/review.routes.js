'use strict';

import { Router } from 'express';

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
    getBranchReviews
);

// Soft Delete PATCH
router.patch(
    '/:id/status',
    validateDeleteReview,
    deleteReview
);

export default router;