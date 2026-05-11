import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateCombo = [
    body('ComboName')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede tener más de 100 caracteres'),

    body('ComboDescription')
        .trim()
        .notEmpty()
        .withMessage('La descripción es requerida')
        .isLength({ max: 100 })
        .withMessage('La descripción no puede tener más de 100 caracteres'),

    body('ComboDiscount')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('El descuento debe ser un número entre 0 y 100'),

    body('ComboStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Estado no válido'),

    checkValidators,
];

export const validateUpdateComboRequest = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    body('ComboName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El nombre no puede tener más de 100 caracteres'),

    body('ComboDescription')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('La descripción no puede tener más de 100 caracteres'),

    body('ComboPrice')
        .optional()
        .isNumeric()
        .withMessage('El precio debe ser un número válido'),

    body('ComboDiscount')
        .optional()
        .trim(),

    body('ComboStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE'])
        .withMessage('Estado no válido'),

    checkValidators,
];

export const validateComboStatusChange = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    checkValidators,
];

export const validateGetComboById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId'),

    checkValidators,
];
