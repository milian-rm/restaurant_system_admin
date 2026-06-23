// C:\2022473\Proyectos 2026\Segundo Bimestre\ProyectoRestaurante\restaurant_system_admin\src\Coupon\coupon.routes.js
'use strict';

import { Router } from 'express';
import { 
    createCoupon, 
    getCoupons, 
    updateCoupon, 
    deleteCoupon,
    getCouponUsage
} from './coupon.controller.js';

import { createCouponValidator } from '../../middlewares/coupon-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/**
 * GET - Listar
 * Cualquier usuario autenticado puede ver los cupones disponibles
 */
router.get(
    '/', 
    [validateJWT], 
    getCoupons
);

/**
 * POST - Crear 
 * Solo el Administrador de la Plataforma puede generar nuevos códigos de descuento
 */
router.post(
    '/', 
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN'), 
        createCouponValidator
    ], 
    createCoupon
);

/**
 * PUT - Actualizar datos generales
 * Solo el Administrador de la Plataforma puede modificar fechas o porcentajes
 */
router.put(
    '/:id', 
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN')
    ], 
    updateCoupon
);

/**
 * PATCH - Borrado Lógico o Desactivación (Toggle Status)
 * Solo el Administrador de la Plataforma puede activar/desactivar cupones
 */
router.patch(
    '/:id/status', 
    [
        validateJWT, 
        hasRole('PLATFORM_ADMIN')
    ], 
    deleteCoupon
);

/**
 * GET - Historial de usos de un cupón por cliente
 * Útil para auditoría y soporte. Soporta ?page=1&limit=20
 */
router.get(
    '/:id/usage',
    [
        validateJWT,
        hasRole('PLATFORM_ADMIN')
    ],
    getCouponUsage
);

export default router;