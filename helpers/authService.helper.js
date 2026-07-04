'use strict';

import axios from 'axios';

// Base = raíz versionada de la API del AuthService, ej: http://localhost:5000/api/v1
// (a diferencia de BackendCliente, que apunta directo a /api/v1/Auth porque solo
// consume ese controller; aquí también necesitamos /api/v1/users/...)
const AUTH_SERVICE_API_URL = process.env.AUTH_SERVICE_API_URL;

export const authServiceClient = axios.create({
    baseURL: AUTH_SERVICE_API_URL,
    timeout: 10000,
});

export const buildAuthForm = (fields = {}) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            form.append(key, value);
        }
    });
    return form;
};

export const pickField = (obj = {}, ...keys) => {
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
};