'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    createBilling,
    payBilling
} from './billing.controller.js';

const router = Router();

router.get('/', getBillings);

router.get('/:id', getBillingById);

router.post('/', createBilling);

router.patch('/pay/:id', payBilling);

export default router;