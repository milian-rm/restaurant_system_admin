import { Router } from 'express';
import {
    saveReservation,
    getReservations,
    updateReservation,
    toggleReservationStatus
} from './reservation.controller.js';

import { reservationValidator } from './reservation.validator.js';

const api = Router();

api.post(
    '/',
    reservationValidator,
    saveReservation
);

api.get(
    '/',
    getReservations
);

api.put(
    '/:id',
    updateReservation
);

api.patch(
    '/:id/status',
    toggleReservationStatus
);

export default api;