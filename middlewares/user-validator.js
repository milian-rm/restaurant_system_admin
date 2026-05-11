// src/middlewares/user-validator.js
import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

const roles = ['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE', 'CLIENT'];

export const validateCreateUser = [
    body('UserName')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo debe contener letras'),

    body('UserSurname')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo debe contener letras'),

    body('UserEmail')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Ingrese un correo electrónico válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),

    body('role')
        .optional()
        .isIn(roles).withMessage('Rol de usuario no válido'),

    body('branchId')
        .optional()
        .isMongoId().withMessage('El ID de la sucursal no es válido'),

    body('UserStatus')
        .optional()
        .isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado no válido'),

    checkValidators,
];

export const validateUpdateUserRequest = [
    // Aquí aceptamos que el ID pueda venir de C# (uid) o de Mongo (_id)
    param('id').notEmpty().withMessage('El ID de usuario es requerido'),

    body('UserName')
        .optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo debe contener letras'),

    body('UserSurname')
        .optional().trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo debe contener letras'),

    body('UserEmail')
        .optional().trim().isEmail().withMessage('Ingrese un correo electrónico válido').normalizeEmail(),

    body('role')
        .optional().isIn(roles).withMessage('Rol de usuario no válido'),

    body('UserStatus')
        .optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Estado no válido'),

    checkValidators,
];

export const validateUserStatusChange = [
    param('id').notEmpty().withMessage('El ID de usuario es requerido'),
    checkValidators,
];

export const validateGetUserById = [
    param('id').notEmpty().withMessage('El ID de usuario es requerido'),
    checkValidators,
];