'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

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

router.get('/',
  validateJWT,
  hasRole('EMPLOYEE','BRANCH_ADMIN','PLATFORM_ADMIN'),
  getOrders
);

router.get('/:id',
  validateJWT,
  hasRole('EMPLOYEE','BRANCH_ADMIN','PLATFORM_ADMIN'),
  getOrderById
);

router.post('/',
  validateJWT,
  hasRole('EMPLOYEE','BRANCH_ADMIN','PLATFORM_ADMIN'),
  validateCreateOrder,
  createOrder
);

router.put('/:id',
  validateJWT,
  hasRole('EMPLOYEE','BRANCH_ADMIN','PLATFORM_ADMIN'),
  updateOrder
);

router.patch('/:id/status',
  validateJWT,
  hasRole('EMPLOYEE','BRANCH_ADMIN','PLATFORM_ADMIN'),
  validateUpdateStatus,
  changeOrderStatus
);

export default router;