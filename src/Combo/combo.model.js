'use strict';

import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
    ComboName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    ComboList: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            default: 1,
            min: [1, 'La cantidad mínima es 1']
        }
    }],
    Branches: [{
        BranchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['Disponible', 'Agotado', 'Descontinuado'],
        default: 'Disponible'
    },
    ComboDescription: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        minlength: [5, 'La descripción debe tener al menos 5 caracteres'],
        maxlength: [300, 'La descripción no puede tener más de 300 caracteres']
    },
    ComboPrice: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo']
    },
    ComboDiscount: {
        type: Number,
        default: 0,
        min: [0, 'El descuento no puede ser negativo'],
        max: [100, 'El descuento no puede superar el 100%']
    },
    ComboStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    image: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
});

comboSchema.index({ ComboName: 1 });

export default mongoose.model("Combo", comboSchema);