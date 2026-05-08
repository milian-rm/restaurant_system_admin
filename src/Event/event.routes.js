'use strict';

import { Router } from 'express';
import {
  getEvents,
  getEventById,
  updateEvent,
  changeEventStatus,
  toggleEventAttendance,
  createEvent,
  deleteEventPermanently 
} from './event.controller.js';

import {
  validateGetEventById,
  validateUpdateEventRequest,
  validateEventStatusChange,
  validateCreateEvent
} from '../../middlewares/event-validator.js';

// MIDDLEWARES DE SEGURIDAD
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// Todos los logueados pueden ver eventos
router.get('/', [validateJWT], getEvents);

router.get('/:id', [validateJWT, validateGetEventById], getEventById);

// Solo Admins pueden Crear/Editar/Borrar
router.post('/', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateCreateEvent], createEvent);

router.put('/:id', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateUpdateEventRequest], updateEvent);

router.patch('/:id/status', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateEventStatusChange], changeEventStatus);

router.patch('/:id/attendance', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], toggleEventAttendance);

// Ruta para el borrado definitivo
router.delete('/:id', [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], deleteEventPermanently);

export default router;