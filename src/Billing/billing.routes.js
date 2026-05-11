// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Billing\billing.routes.js
'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    createBilling,
    payBilling
} from './billing.controller.js';

// IMPORTAR SEGURIDAD
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

// IMPORTAR VALIDADORES
import {
    validateCreateBilling,
    validateBillingPay,
    validateGetBillingById
} from '../../middlewares/billing-validator.js';

const router = Router();

/**
 * GET - Ver todas las facturas (Con paginación y filtros)
 * Protegido para que solo los administradores puedan ver la contabilidad
 */
router.get(
    '/', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')], 
    getBillings
);

/**
 * GET - Ver detalle de una factura específica
 */
router.get(
    '/:id', 
    [validateJWT, validateGetBillingById], 
    getBillingById
);

/**
 * POST - Generar una nueva factura
 * Protegido: Solo personal autorizado puede facturar
 */
router.post(
    '/', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateCreateBilling], 
    createBilling
);

/**
 * PATCH - Pagar factura (Cambia a PAYED y libera la mesa)
 * Protegido: Solo cajeros/administradores pueden marcar como pagado
 */
router.patch(
    '/pay/:id', 
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateBillingPay], 
    payBilling
);

export default router;