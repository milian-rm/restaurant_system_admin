'use strict';

import { Router } from 'express';
import {
    getEventRequests,
    getEventRequestById,
    respondEventRequest,
} from './eventRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], getEventRequests);
router.get('/:id', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], getEventRequestById);
router.patch('/:id/respond', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], respondEventRequest);

export default router;