import { Router } from 'express';

import {
    getAdditionalServices,
    createAdditionalService,
    updateAdditionalService,
    changeAdditionalServiceStatus
} from './additionalService.controller.js';

import {
    validateCreateAdditionalService,
    validateUpdateAdditionalService,
    validateAdditionalServiceStatusChange
} from '../../middlewares/additionalService-validator.js';

import { uploadAdditionalServiceImage } from '../../middlewares/file-uploader.js';

const router = Router();

router.get('/', getAdditionalServices);

router.post(
    '/',
    uploadAdditionalServiceImage.single('image'),
    validateCreateAdditionalService,
    createAdditionalService
);

router.put(
    '/:id',
    uploadAdditionalServiceImage.single('image'),
    validateUpdateAdditionalService,
    updateAdditionalService
);

router.patch(
    '/:id/status',
    validateAdditionalServiceStatusChange,
    changeAdditionalServiceStatus
);

export default router;