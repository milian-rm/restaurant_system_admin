// src/Product/product.routes.js
'use strict';

import { Router } from 'express';
import {
    getProducts,
    createProduct,
    updatedProduct,
    changeProductStatus
} from './product.controller.js';

import {
    validateCreateProduct,
    validateProductId
} from '../../middlewares/product.validator.js';

import { uploadProductImage } from '../../middlewares/file-uploader.js';

// IMPORTAR SEGURIDAD
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// GET - Todos pueden ver los productos (útil para el menú y el admin)
router.get(
    '/',
    [validateJWT], 
    getProducts
);

// POST - Solo Admins
router.post(
    '/',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')],
    uploadProductImage.single('imagen'),
    validateCreateProduct,
    createProduct
);

// PUT - Solo Admins
router.put(
    '/:id',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN')],
    uploadProductImage.single('imagen'),
    validateProductId,
    updatedProduct
);

// PATCH (Soft Delete) - Solo Admins
router.patch(
    '/:id/status',
    [validateJWT, hasRole('PLATFORM_ADMIN', 'BRANCH_ADMIN'), validateProductId],
    changeProductStatus
);

export default router;