'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
  getEvents,
  getEventById,
  updateEvent,
  changeEventStatus,
  toggleEventAttendance
} from './event.controller.js';

import {
  validateGetEventById,
  validateUpdateEventRequest,
  validateEventStatusChange
} from '../../middlewares/event-validator.js';

const router = Router();

router.get('/', 
    validateJWT, 
    getEvents
);

router.get('/:id', 
    validateJWT, 
    validateGetEventById, 
    getEventById
);

router.put('/:id', 
    validateJWT, 
    validateUpdateEventRequest, 
    updateEvent
);

router.patch('/:id/status', 
    validateJWT, 
    validateEventStatusChange, 
    changeEventStatus
);

router.patch(
  '/:id/attendance',
  [validateJWT, hasRole('EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN')],
  toggleEventAttendance
);

export default router;