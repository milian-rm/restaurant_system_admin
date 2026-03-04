'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    createBilling,
    payBilling
} from './billing.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', [validateJWT, 
    hasRole('PLATFORM_ADMIN','BRANCH_ADMIN','EMPLOYEE')], 
    getBillings
);

router.get('/:id', [validateJWT, 
    hasRole('PLATFORM_ADMIN','BRANCH_ADMIN','EMPLOYEE')], 
    getBillingById
);


router.post('/', [validateJWT, 
    hasRole('PLATFORM_ADMIN','BRANCH_ADMIN','EMPLOYEE')], 
    createBilling
);

router.patch('/pay/:id', [validateJWT, 
    hasRole('PLATFORM_ADMIN','BRANCH_ADMIN','EMPLOYEE')], 
    payBilling
);

export default router;