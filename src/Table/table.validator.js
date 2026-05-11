// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Table\table.validator.js
import { body, validationResult } from 'express-validator';

const validateFields = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const tableValidator = [
    body('branchId')
        .notEmpty().withMessage('La sucursal es obligatoria')
        .isMongoId().withMessage('ID de sucursal inválido'),

    body('numberTable')
        .notEmpty().withMessage('El número de mesa es obligatorio')
        .isInt({ min: 1, max: 1000 }).withMessage('El número de mesa debe estar entre 1 y 1000'),

    body('capacity')
        .notEmpty().withMessage('La capacidad es obligatoria')
        .isInt({ min: 1, max: 50 }).withMessage('La capacidad debe ser entre 1 y 50 personas'),

    body('TableStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado inválido'),

    body('availability')
        .optional()
        .isIn(['Disponible', 'Ocupada', 'Mantenimiento']).withMessage('Disponibilidad inválida'),

    body('coords')
        .optional()
        .isArray().withMessage('Las coordenadas deben ser un arreglo'),

    validateFields
];