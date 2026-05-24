// src/Billing/billing.routes.js
'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    createBilling,
    payBilling,
    syncBillingWithOrder
} from './billing.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
    validateCreateBilling,
    validateBillingPay,
    validateGetBillingById
} from '../../middlewares/billing-validator.js';

const router = Router();

/**
 * GET - Ver todas las facturas (Con paginación y filtros)
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
 */
router.post(
    '/',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateCreateBilling],
    createBilling
);

/**
 * PATCH - Sincronizar factura con el total actualizado de la orden
 * IMPORTANTE: Esta ruta debe estar ANTES de /pay/:id para evitar
 * que Express capture "sync" como el valor del parámetro :id
 */
router.patch(
    '/sync/:orderId',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')],
    syncBillingWithOrder
);

/**
 * PATCH - Pagar factura (Cambia a PAYED y libera la mesa)
 */
router.patch(
    '/pay/:id',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateBillingPay],
    payBilling
);

export default router;