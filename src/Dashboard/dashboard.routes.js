'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import {
    getDashboardSummary,
    getDashboardRecentOrders,
    getDashboardUpcomingReservations,
} from './dashboard.controller.js';

const router = Router();

router.get(
    '/summary',
    [validateJWT, hasRole('PLATFORM_ADMIN')],
    getDashboardSummary
);

router.get(
    '/recent-orders',
    [validateJWT, hasRole('PLATFORM_ADMIN')],
    getDashboardRecentOrders
);

router.get(
    '/upcoming-reservations',
    [validateJWT, hasRole('PLATFORM_ADMIN')],
    getDashboardUpcomingReservations
);

export default router;