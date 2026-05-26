import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateBilling = [
    body('Order')
        .notEmpty()
        .withMessage('La orden es requerida')
        .isMongoId()
        .withMessage('La orden debe ser un ObjectId válido'),

    body('BillSerie')
        .optional()
        .trim()
        .isLength({ min: 3, max: 35 })
        .withMessage('La serie debe tener entre 3 y 35 caracteres'),

    body('BillPaymentMethod')
        .notEmpty()
        .withMessage('El método de pago es requerido')
        .isIn(['CASH', 'CARD'])
        .withMessage('Método de pago no válido'),

    body('BillSubtotal')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El subtotal no puede ser negativo'),

    body('BillIVA')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El IVA no puede ser negativo'),

    body('BillTotal')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El total no puede ser negativo'),

    checkValidators,
];

export const validateUpdateBillingRequest = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    body('BillSerie')
        .optional()
        .trim()
        .isLength({ min: 3, max: 35 })
        .withMessage('La serie debe tener entre 3 y 35 caracteres'),

    body('BillPaymentMethod')
        .optional()
        .isIn(['CASH', 'CARD'])
        .withMessage('Método de pago no válido'),

    body('BillSubtotal')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El subtotal no puede ser negativo'),

    body('BillIVA')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El IVA no puede ser negativo'),

    body('BillTotal')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El total no puede ser negativo'),

    checkValidators,
];

export const validateBillingPay = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    checkValidators,
];

export const validateGetBillingById = [
    param('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido'),

    checkValidators,
];