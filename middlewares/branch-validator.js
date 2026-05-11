// src/middlewares/branch-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

const branchStatuses = ['ACTIVE', 'INACTIVE'];
const categories = ['Gourmet', 'Buffet', 'Fast Food', 'Familiar'];

export const validateCreateBranch = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre de la sucursal es requerido')
        .isLength({ min: 3, max: 80 }).withMessage('El nombre debe tener entre 3 y 80 caracteres'),

    body('address')
        .trim()
        .notEmpty().withMessage('La dirección es requerida')
        .isLength({ min: 5, max: 150 }).withMessage('La dirección debe ser más descriptiva (5-150 caracteres)'),

    body('city')
        .optional()
        .isString()
        .trim(),

    body('zone')
        .notEmpty().withMessage('La zona es requerida')
        .isInt({ min: 1, max: 25 }).withMessage('La zona debe ser un número real en Guatemala (1-25)'),

    body('phone')
        .notEmpty().withMessage('El teléfono es requerido')
        // Validamos que sean exactamente 8 dígitos numéricos
        .matches(/^[0-9]{8}$/).withMessage('El teléfono debe tener exactamente 8 dígitos sin espacios ni guiones'),

    body('Email')
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Debe ser un formato de correo electrónico válido')
        .normalizeEmail(), // Convierte a minúsculas y limpia

    body('tableCapacity')
        .optional()
        .isInt({ min: 0, max: 500 }).withMessage('La capacidad de mesas debe estar entre 0 y 500'),

    body('Category')
        .notEmpty().withMessage('La categoría es requerida')
        .isIn(categories).withMessage('Categoría no válida. Opciones: Gourmet, Buffet, Fast Food, Familiar'),

    body('hasDriveThru')
        .optional()
        .isBoolean().withMessage('El Auto-servicio debe ser verdadero o falso'),

    body('AveragePrices')
        .notEmpty().withMessage('El precio promedio es requerido')
        .isFloat({ min: 1.00 }).withMessage('El precio promedio debe ser mayor a Q1.00'),

    body('OpenedAt')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de apertura inválido (HH:mm)'),

    body('ClosedAt')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de cierre inválido (HH:mm)'),

    body('branchStatus')
        .optional()
        .isIn(branchStatuses).withMessage('Estado de sucursal no válido'),

    checkValidators
];

export const validateUpdateBranch = [
    param('id').isMongoId().withMessage('ID de sucursal inválido'),
    
    // Al editar, todos los campos son opcionales, pero si vienen, deben cumplir las mismas reglas
    body('name').optional().trim().isLength({ min: 3, max: 80 }).withMessage('El nombre debe tener entre 3 y 80 caracteres'),
    body('address').optional().trim().isLength({ min: 5, max: 150 }).withMessage('La dirección debe tener entre 5 y 150 caracteres'),
    body('zone').optional().isInt({ min: 1, max: 25 }).withMessage('La zona debe ser un número entre 1 y 25'),
    body('phone').optional().matches(/^[0-9]{8}$/).withMessage('El teléfono debe tener exactamente 8 dígitos'),
    body('Email').optional().isEmail().withMessage('Debe ser un correo válido').normalizeEmail(),
    body('tableCapacity').optional().isInt({ min: 0, max: 500 }).withMessage('Capacidad inválida'),
    body('Category').optional().isIn(categories).withMessage('Categoría no válida'),
    body('AveragePrices').optional().isFloat({ min: 1.00 }).withMessage('El precio promedio debe ser mayor a Q1.00'),
    body('OpenedAt').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato inválido (HH:mm)'),
    body('ClosedAt').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato inválido (HH:mm)'),
    body('branchStatus').optional().isIn(branchStatuses).withMessage('Estado inválido'),

    checkValidators
];

export const validateBranchIdParam = [
    param('id').isMongoId().withMessage('ID de sucursal inválido'),
    checkValidators
];