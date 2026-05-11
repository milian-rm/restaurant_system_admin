// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Combo\combo.routes.js
'use strict';

import { Router } from 'express';
import {
    getCombos,
    getComboById,
    createCombo,
    updateCombo,
    changeComboStatus
} from './combo.controller.js';

// MIDDLEWARES DE SEGURIDAD
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
    validateCreateCombo,
    validateUpdateComboRequest,
    validateComboStatusChange,
    validateGetComboById
} from '../../middlewares/combo-validator.js';

const router = Router();

// Todos pueden ver los combos
router.get('/', [validateJWT], getCombos);

router.get('/:id', [validateJWT, validateGetComboById], getComboById);

// Solo administradores pueden gestionar la oferta
router.post(
    '/', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateCreateCombo], 
    createCombo
);

router.put(
    '/:id', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateUpdateComboRequest], 
    updateCombo
);

router.patch(
    '/:id/status', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateComboStatusChange], 
    changeComboStatus
);

export default router;