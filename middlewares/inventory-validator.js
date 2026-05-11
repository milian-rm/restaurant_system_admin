// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\middlewares\inventory-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js'; // 👈 Estandarizado

export const inventoryValidator = [
    body('branchId')
        .notEmpty().withMessage('La sucursal es obligatoria')
        .isMongoId().withMessage('ID de sucursal inválido'),

    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('description')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria')
        .isLength({ min: 5, max: 250 }).withMessage('La descripción debe tener entre 5 y 250 caracteres'),

    body('stock')
        .notEmpty().withMessage('El stock es obligatorio')
        .isInt({ min: 0, max: 100000 }).withMessage('El stock debe ser un número entre 0 y 100,000'),

    body('unitCost')
        .notEmpty().withMessage('El costo es obligatorio')
        .isFloat({ min: 0.01, max: 50000 }).withMessage('El costo debe ser mayor a Q0.01'),

    checkValidators 
];

export const updateInventoryValidator = [
    param('id').isMongoId().withMessage('ID de insumo inválido'),
    body('branchId').optional().isMongoId().withMessage('ID de sucursal inválido'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('description').optional().trim().isLength({ min: 5, max: 250 }).withMessage('La descripción debe tener entre 5 y 250 caracteres'),
    body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock inválido'),
    body('unitCost').optional().isFloat({ min: 0.01, max: 50000 }).withMessage('Costo inválido'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado inválido'),
    checkValidators
];