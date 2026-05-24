'use strict';

import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    address: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true,
        minlength: [5, 'La dirección debe tener al menos 5 caracteres']
    },
    city: {
        type: String,
        required: [true, 'La ciudad es requerida'],
        trim: true,
        default: 'Guatemala'
    },
    zone: {
        type: Number,
        required: [true, 'La zona es requerida'],
        min: [1, 'La zona mínima es 1'],
        max: [25, 'La zona máxima es 25']
    },
    // Guardado como String para preservar ceros iniciales (ej. 02345678)
    // y poder validar exactamente 8 dígitos con regex.
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido'],
        trim: true,
        match: [/^\d{8}$/, 'El teléfono debe tener exactamente 8 dígitos numéricos']
    },
    Email: {
        type: String,
        required: [true, 'El correo es requerido'],
        trim: true,
        lowercase: true
    },
    tableCapacity: {
        type: Number,
        default: 0,
        min: [0, 'La capacidad no puede ser negativa']
    },
    Category: {
        type: String,
        enum: ['Gourmet', 'Buffet', 'Fast Food', 'Familiar'],
        required: [true, 'La categoría es requerida']
    },
    hasDriveThru: {
        type: Boolean,
        default: true
    },
    OpenedAt: {
        type: String,
        default: '06:00',
        required: [true, 'La hora de apertura es requerida']
    },
    ClosedAt: {
        type: String,
        default: '18:00',
        required: [true, 'La hora de cierre es requerida']
    },
    branchStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    Photos: [{
        ImageURL: {
            type: String,
            default: 'branches/restaurant_generic'
        }
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

branchSchema.index({ zone: 1, name: 1 });

export default mongoose.model('Branch', branchSchema);