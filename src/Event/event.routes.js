'use strict';

import { Router } from 'express';

import {
  getEvents,
  getEventById,
  updateEvent,
  changeEventStatus,
  toggleEventAttendance,
  createEvent
} from './event.controller.js';

import {
  validateGetEventById,
  validateUpdateEventRequest,
  validateEventStatusChange,
  validateCreateEvent
} from '../../middlewares/event-validator.js';

const router = Router();

router.get(
  '/',
  getEvents
);

router.get(
  '/:id',
  validateGetEventById,
  getEventById
);

router.put(
  '/:id',
  validateUpdateEventRequest,
  updateEvent
);

router.patch(
  '/:id/status',
  validateEventStatusChange,
  changeEventStatus
);

router.patch(
  '/:id/attendance',
  toggleEventAttendance
);

router.post(
  '/',
  validateCreateEvent,
  createEvent
);

export default router;