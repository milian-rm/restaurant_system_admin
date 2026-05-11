// middlewares/product.validator.js
'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateProduct = [
    body('nombre')
        .notEmpty().withMessage('El nombre del producto es obligatorio')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres')
        .trim(),

    body('categoria')
        .notEmpty().withMessage('La categoría es obligatoria')
        .isLength({ max: 50 }).withMessage('La categoría no puede exceder los 50 caracteres')
        .trim(),

    body('precio')
        .notEmpty().withMessage('El precio es obligatorio')
        .isFloat({ min: 0 }).withMessage('El precio no puede ser negativo'),

    body('estado')
        .optional()
        .isIn(['Disponible', 'Agotado', 'Descontinuado'])
        .withMessage('Estado de producto no válido'),

    // Validación para asegurarse de que no manden campos prohibidos en la creación
    body('ProductStatus').not().exists().withMessage('No puedes definir el status de eliminación manualmente'),
    body('deletedAt').not().exists().withMessage('No puedes definir la fecha de eliminación manualmente'),

    checkValidators
];

export const validateProductId = [
    param('id')
        .isMongoId()
        .withMessage('El ID del producto debe ser un ObjectId válido'),
    checkValidators
];