'use strict';

import { Router } from 'express';

import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  changeOrderStatus
} from './order.controller.js';

import {
  validateCreateOrder,
  validateUpdateStatus
} from '../../middlewares/order.validator.js';

const router = Router();

router.get(
  '/',
  getOrders
);

router.get(
  '/:id',
  getOrderById
);

router.post(
  '/',
  validateCreateOrder,
  createOrder
);

router.put(
  '/:id',
  updateOrder
);

router.patch(
  '/:id/status',
  validateUpdateStatus,
  changeOrderStatus
);

export default router;