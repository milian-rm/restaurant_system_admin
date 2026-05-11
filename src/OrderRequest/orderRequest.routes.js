'use strict';

import { Router } from 'express';
import { getBranchOrderRequests, updateOrderRequestStatus } from './orderRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/branch/:branchId', [validateJWT], getBranchOrderRequests);
router.patch('/:id/status', [validateJWT], updateOrderRequestStatus);

export default router;