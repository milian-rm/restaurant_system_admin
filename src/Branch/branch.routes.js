// src/Branch/branch.routes.js
'use strict';

import { Router } from 'express';
import {
    createBranch,
    getBranches,
    updateBranch,
    changeBranchStatus
} from './branch.controller.js';

import {
    validateCreateBranch,
    validateUpdateBranch,
    validateBranchIdParam
} from '../../middlewares/branch-validator.js';

import { uploadBranchImage } from '../../middlewares/file-uploader.js';

const router = Router();

router.post(
    '/',
    uploadBranchImage.single('Photos'),
    validateCreateBranch,
    createBranch
);

router.get(
    '/',
    getBranches
);

router.put(
    '/:id',
    uploadBranchImage.single('Photos'),
    validateUpdateBranch,
    updateBranch
);

router.patch(
    '/:id/status',
    validateBranchIdParam,
    changeBranchStatus
);

export default router;