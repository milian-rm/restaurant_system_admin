'use strict';

import { Router } from 'express';
import {
    getBranchOrderRequests,
    updateOrderRequestStatus
} from './orderRequest.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import {
    validateUpdateOrderRequestStatus
} from '../../middlewares/orderRequest-validator.js';

const router = Router();

/**
 * PERSONAL RESTAURANTE
 */

// Ver pedidos por sucursal
router.get(
    '/branch/:branchId',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    getBranchOrderRequests
);

// Cambiar estado del pedido
router.patch(
    '/:id/status',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    validateUpdateOrderRequestStatus,
    updateOrderRequestStatus
);

export default router;