// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Reservation\reservation.validator.js
import { body, param, validationResult } from 'express-validator';
import { checkValidators } from '../../middlewares/check.validators.js'; // Ajusta la ruta si es necesario

export const reservationValidator = [
    body('branchId')
        .notEmpty().withMessage('La sucursal es obligatoria')
        .isMongoId().withMessage('ID de sucursal inválido'),

    body('clientId')
        .notEmpty().withMessage('El cliente es obligatorio')
        .isString(), // Como el ID viene de C#, usamos String

    body('date')
        .notEmpty().withMessage('La fecha es obligatoria')
        .isISO8601().withMessage('Formato de fecha inválido')
        .toDate()
        .custom((value) => {
            // Creamos fechas sin horas para compararlas de forma justa
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const reservationDate = new Date(value);
            reservationDate.setHours(0, 0, 0, 0);

            if (reservationDate < today) {
                throw new Error('No puedes hacer una reservación en el pasado');
            }
            return true;
        }),

    body('time')
        .notEmpty().withMessage('La hora es obligatoria')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:mm'),

    body('numberOfPersons')
        .notEmpty().withMessage('Debe indicar la cantidad de personas')
        .isInt({ min: 1, max: 50 }).withMessage('La reserva debe ser para entre 1 y 50 personas'),

    body('status')
        .optional()
        .isIn(['Confirmada', 'Pendiente', 'Cancelada', 'Completada']).withMessage('Estado inválido'),

    body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 250 }).withMessage('Las notas no pueden exceder los 250 caracteres'),

    checkValidators
];

export const updateReservationValidator = [
    param('id').isMongoId().withMessage('ID de reservación inválido'),
    body('branchId').optional().isMongoId(),
    body('clientId').optional().isString(),
    body('date').optional().isISO8601().toDate().custom((value) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationDate = new Date(value);
        reservationDate.setHours(0, 0, 0, 0);
        if (reservationDate < today) throw new Error('No puedes reprogramar al pasado');
        return true;
    }),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('numberOfPersons').optional().isInt({ min: 1, max: 50 }),
    body('status').optional().isIn(['Confirmada', 'Pendiente', 'Cancelada', 'Completada']),
    body('statusRes').optional().isIn(['ACTIVADO', 'DESACTIVADO']),
    body('notes').optional().trim().isLength({ max: 250 }),
    checkValidators
];