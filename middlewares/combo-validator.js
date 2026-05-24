import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateCombo = [
    body('ComboName')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('ComboDescription')
        .trim()
        .notEmpty()
        .withMessage('La descripción es requerida')
        .isLength({ min: 5, max: 300 })
        .withMessage('La descripción debe tener entre 5 y 300 caracteres'),

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
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('ComboDescription')
        .optional()
        .trim()
        .isLength({ min: 5, max: 300 })
        .withMessage('La descripción debe tener entre 5 y 300 caracteres'),

    body('ComboPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio no puede ser negativo'),

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