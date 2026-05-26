'use strict';

import { Schema, model } from 'mongoose';

const tableSchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'La sucursal es obligatoria']
    },
    numberTable: {
        type: Number,
        required: [true, 'El número de mesa es obligatorio'],
        min: [1, 'El número de mesa mínimo es 1'],
        max: [1000, 'El número de mesa no puede exceder 1000']
    },
    capacity: {
        type: Number,
        required: [true, 'La capacidad es obligatoria'],
        min: [1, 'La capacidad mínima es 1 persona'],
        max: [50, 'La capacidad máxima es 50 personas']
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