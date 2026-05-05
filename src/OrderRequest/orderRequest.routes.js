'use strict';

import { Router } from 'express';
import {
    getBranchOrderRequests,
    updateOrderRequestStatus
} from './orderRequest.controller.js';

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
    getBranchOrderRequests
);

// Cambiar estado del pedido
router.patch(
    '/:id/status',
    validateUpdateOrderRequestStatus,
    updateOrderRequestStatus
);

export default router;