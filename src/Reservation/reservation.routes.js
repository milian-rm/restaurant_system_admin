// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Reservation\reservation.routes.js
import { Router } from 'express';
import {
    saveReservation,
    getReservations,
    updateReservation,
    toggleReservationStatus
} from './reservation.controller.js';

import { reservationValidator } from './reservation.validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const api = Router();

/**
 * GET - Listar Reservas
 * Todo empleado o admin necesita ver la agenda del día.
 */
api.get(
    '/',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')],
    getReservations
);

/**
 * POST - Crear Reserva manual (Vía Teléfono o Recepción)
 */
api.post(
    '/',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'), 
        reservationValidator
    ],
    saveReservation
);

/**
 * PUT - Actualizar (Cambiar mesa, pax, fecha)
 */
api.put(
    '/:id',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')
    ],
    updateReservation
);

/**
 * PATCH - Cancelar/Activar
 * Las cancelaciones requieren un nivel administrativo.
 */
api.patch(
    '/:id/status',
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')
    ],
    toggleReservationStatus
);

export default api;