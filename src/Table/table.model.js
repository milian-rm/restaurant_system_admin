'use strict';

import { Schema, model } from 'mongoose';

const tableSchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    numberTable: {
        type: Number,
        required: [true, 'El número de mesa es obligatorio']
        // NO unique aquí
    },
    capacity: {
        type: Number,
        required: [true, 'La capacidad es obligatoria']
    },
    TableStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    Coordinates: {
        type: [Number],
        default: [0, 0]
    },
    availability: {
        type: String,
        enum: ['Disponible', 'Ocupada', 'Mantenimiento'],
        default: 'Disponible'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { versionKey: false, timestamps: true });

// Número de Mesa único por sucursal
tableSchema.index({ branchId: 1, numberTable: 1 }, { unique: true });

export default model('Table', tableSchema);