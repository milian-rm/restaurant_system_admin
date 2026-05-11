'use strict';

import { Router } from 'express';
import { getOrders, getOrderById, createOrder, updateOrder, changeOrderStatus } from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', [validateJWT], getOrders);
router.get('/:id', [validateJWT], getOrderById);
router.post('/', [validateJWT], createOrder);
router.put('/:id', [validateJWT], updateOrder);
router.patch('/:id/status', [validateJWT], changeOrderStatus);

export default router;