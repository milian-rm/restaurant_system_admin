import { Router } from 'express';
import {
    getCombos,
    getComboById,
    createCombo,
    updateCombo,
    changeComboStatus
} from './combo.controller.js';

import {
    validateCreateCombo,
    validateUpdateComboRequest,
    validateComboStatusChange,
    validateGetComboById
} from '../../middlewares/combo-validator.js';

const router = Router();

router.get(
    '/',
    getCombos
);

router.get(
    '/:id',
    validateGetComboById,
    getComboById
);

router.post(
    '/',
    validateCreateCombo,
    createCombo
);

router.put(
    '/:id',
    validateUpdateComboRequest,
    updateCombo
);

router.patch(
    '/:id/status',
    validateComboStatusChange,
    changeComboStatus
);

export default router;