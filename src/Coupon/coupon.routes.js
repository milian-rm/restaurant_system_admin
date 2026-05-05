'use strict';

import { Router } from 'express';
import { 
    createCoupon, 
    getCoupons, 
    updateCoupon, 
    deleteCoupon 
} from './coupon.controller.js';

import { createCouponValidator } from '../../middlewares/coupon-validator.js';

const router = Router();

// POST - Crear 
router.post('/', [createCouponValidator], createCoupon);

// GET - Listar
router.get('/', getCoupons);

// PUT - Actualizar datos generales
router.put('/:id', updateCoupon);

/**
 * PATCH - Borrado Lógico o Desactivación
 */
router.patch('/:id/status', deleteCoupon);

export default router;