// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\middlewares\event-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

const isWithinTimeRange = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const minTime = 7 * 60;  // 07:00
    const maxTime = 22 * 60; // 22:00

    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
        throw new Error('El horario debe estar entre las 07:00 y las 22:00');
    }
    return true;
};

export const validateCreateEvent = [
    body('branchId')
        .notEmpty().withMessage('La sucursal es obligatoria')
        .isMongoId().withMessage('La sucursal debe ser un ObjectId válido'),

    body('clientId')
        .notEmpty().withMessage('El cliente es obligatorio')
        .isString(), 

    body('name')
        .trim()
        .notEmpty().withMessage('El nombre del evento es obligatorio')
        .isLength({ min: 5, max: 100 }).withMessage('El nombre debe tener entre 5 y 100 caracteres'),

    body('eventDate')
        .notEmpty().withMessage('La fecha del evento es obligatoria')
        .isISO8601().withMessage('La fecha debe tener formato válido (YYYY-MM-DD)')
        .toDate()
        .custom((value) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            
            const minDate = new Date(today);
            minDate.setMonth(minDate.getMonth() + 1); 

            const eventDate = new Date(value);
            eventDate.setHours(0, 0, 0, 0); 

            if (eventDate < minDate) {
                throw new Error('La fecha del evento debe ser al menos con 1 mes de anticipación');
            }
            return true;
        }),

    body('startTime')
        .notEmpty().withMessage('La hora de inicio es obligatoria')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:mm')
        .custom(isWithinTimeRange),

    body('endTime')
        .notEmpty().withMessage('La hora de finalización es obligatoria')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:mm')
        .custom(isWithinTimeRange)
        .custom((value, { req }) => {
            if (value <= req.body.startTime) {
                throw new Error('La hora de finalización debe ser posterior a la de inicio');
            }
            return true;
        }),

    body('numberOfPersons')
        .notEmpty().withMessage('Debe indicar la cantidad de personas')
        .isInt({ min: 1, max: 1000 }).withMessage('La cantidad debe ser entre 1 y 1000 personas'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Las notas no pueden exceder los 500 caracteres'),

    checkValidators,
];

export const validateUpdateEventRequest = [
    param('id').isMongoId().withMessage('El ID debe ser un ObjectId válido'),
    body('branchId').optional().isMongoId(),
    body('clientId').optional().isString(), 
    body('name').optional().trim().isLength({ min: 5, max: 100 }),
    body('eventDate').optional().isISO8601().toDate().custom((value) => {
        if (!value) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setMonth(minDate.getMonth() + 1);
        
        const eventDate = new Date(value);
        eventDate.setHours(0, 0, 0, 0);
        
        if (eventDate < minDate) {
            throw new Error('La fecha actualizada debe mantener el margen de 1 mes de anticipación');
        }
        return true;
    }),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).custom(isWithinTimeRange),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).custom(isWithinTimeRange),
    body('numberOfPersons').optional().isInt({ min: 1, max: 1000 }),
    body('status').optional().isIn(['Pendiente', 'Confirmado', 'Cancelado', 'Finalizado']).withMessage('Estado no válido'),
    body('notes').optional().trim().isLength({ max: 500 }),
    checkValidators,
];

export const validateEventStatusChange = [
    param('id').isMongoId().withMessage('El ID debe ser un ObjectId válido'),
    body('status').notEmpty().isIn(['Pendiente', 'Confirmado', 'Cancelado', 'Finalizado']).withMessage('Estado no válido'),
    checkValidators,
];

export const validateGetEventById = [
    param('id').isMongoId().withMessage('El ID debe ser un ObjectId válido'),
    checkValidators,
];