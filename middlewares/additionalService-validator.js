// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\middlewares\additionalService-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateAdditionalService = [
    body('Name')
        .trim()
        .notEmpty().withMessage('El nombre del servicio es obligatorio')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('Description')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria')
        .isLength({ min: 10, max: 500 }).withMessage('La descripción debe ser detallada (10 a 500 caracteres)'),

    body('AdditionalPrice')
        .notEmpty().withMessage('El precio adicional es obligatorio')
        .isFloat({ min: 0.01, max: 10000 }).withMessage('El precio debe estar entre Q0.01 y Q10,000'),

    body('status')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado inválido'),

    checkValidators,
];

export const validateUpdateAdditionalService = [
    param('id').isMongoId().withMessage('El ID debe ser válido'),

    body('Name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Nombre entre 3 y 100 caracteres'),
    body('Description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Descripción entre 10 y 500 caracteres'),
    body('AdditionalPrice').optional().isFloat({ min: 0.01, max: 10000 }).withMessage('El precio debe estar entre Q0.01 y Q10,000'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']),

    checkValidators,
];

export const validateAdditionalServiceStatusChange = [
    param('id').isMongoId().withMessage('El ID debe ser válido'),
    checkValidators,
];