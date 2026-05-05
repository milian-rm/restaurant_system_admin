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

const router = Router();

router.get('/', getAdditionalServices);

router.post(
    '/',
    validateCreateAdditionalService,
    createAdditionalService
);

router.put(
    '/:id',
    validateUpdateAdditionalService,
    updateAdditionalService
);

router.patch(
    '/:id/status',
    validateAdditionalServiceStatusChange,
    changeAdditionalServiceStatus
);

export default router;