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

const router = Router();

router.get(
    '/',
    getProducts
);

router.post(
    '/',
    uploadProductImage.single('imagen'),
    validateCreateProduct,
    createProduct
);

router.put(
    '/:id',
    uploadProductImage.single('imagen'),
    validateProductId,
    updatedProduct
);

router.patch(
    '/:id/status',
    validateProductId,
    changeProductStatus
);

export default router;