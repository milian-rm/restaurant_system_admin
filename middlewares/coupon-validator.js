// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\middlewares\coupon-validator.js
'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js'; 

export const createCouponValidator = [
    body('code')
        .trim()
        .notEmpty().withMessage('El código es obligatorio')
        .isAlphanumeric().withMessage('El código solo puede contener letras y números, sin espacios')
        .isLength({ min: 3, max: 15 }).withMessage('El código debe tener entre 3 y 15 caracteres')
        .toUpperCase(),
    
    body('discountPercentage')
        .notEmpty().withMessage('El porcentaje es obligatorio')
        .isInt({ min: 1, max: 100 }).withMessage('El descuento debe ser un número entero entre 1 y 100'),
        
    body('expirationDate')
        .notEmpty().withMessage('La fecha es obligatoria')
        .isISO8601().withMessage('Formato de fecha inválido')
        .toDate()
        .custom((value) => {
            // Validar que no pongan fechas del pasado
            if (value < new Date()) {
                throw new Error('La fecha de expiración debe ser en el futuro');
            }
            return true;
        }),

    body('usageLimit')
        .notEmpty().withMessage('El límite es obligatorio')
        .isInt({ min: 1, max: 10000 }).withMessage('El límite de uso debe ser entre 1 y 10000'),

    checkValidators 
];

export const updateCouponValidator = [
    param('id').isMongoId().withMessage('ID de cupón inválido'),
    body('code').optional().trim().isAlphanumeric().withMessage('Solo letras y números').isLength({ min: 3, max: 15 }).toUpperCase(),
    body('discountPercentage').optional().isInt({ min: 1, max: 100 }).withMessage('Descuento entre 1 y 100'),
    body('expirationDate').optional().isISO8601().toDate().custom((value) => {
        if (value < new Date()) throw new Error('La fecha debe ser en el futuro');
        return true;
    }),
    body('usageLimit').optional().isInt({ min: 1, max: 10000 }),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado inválido'),
    checkValidators
];