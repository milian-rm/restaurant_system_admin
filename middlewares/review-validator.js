'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

/* =========================================
   ENUMS / REGLAS
========================================= */

const MIN_RATING = 1;
const MAX_RATING = 5;






/* =========================================
   VALIDAR ELIMINAR RESEÑA
========================================= */

export const validateDeleteReview = [

    param('id')
        .isMongoId().withMessage('ID inválido'),

    checkValidators
];