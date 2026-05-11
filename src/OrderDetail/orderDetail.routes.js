'use strict';

import { Router } from 'express';
import { createOrderDetail, getOrderDetailsByOrder, updateOrderDetail, deleteOrderDetail } from './orderDetail.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.post('/', [validateJWT], createOrderDetail);
router.get('/order/:orderId', [validateJWT], getOrderDetailsByOrder);
router.put('/:id', [validateJWT], updateOrderDetail);
router.delete('/:id', [validateJWT], deleteOrderDetail);

export default router;