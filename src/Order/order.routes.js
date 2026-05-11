'use strict';

import { Router } from 'express';
import { hasRole } from '../../middlewares/role-validator.js';
import { getOrders, getOrderById, createOrder, updateOrder, changeOrderStatus } from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', [validateJWT], hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), getOrders);
router.get('/:id', [validateJWT], hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), getOrderById);
router.post('/', [validateJWT], hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), createOrder);
router.put('/:id', [validateJWT], hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), updateOrder);
router.patch('/:id/status', [validateJWT], hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), changeOrderStatus);

export default router;