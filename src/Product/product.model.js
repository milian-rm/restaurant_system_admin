'use strict';

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    Branches: [{
        BranchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            required: true
        }
    }],
    ingredientes: [{
        inventoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        cantidadUsada: {
            type: Number,
            required: true,
            default: 1,
            min: [1, 'La cantidad usada debe ser al menos 1']
        }
    }],
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    categoria: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        trim: true,
        minlength: [2, 'La categoría debe tener al menos 2 caracteres'],
        maxlength: [50, 'La categoría no puede exceder 50 caracteres']
    },
    precio: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0.01, 'El precio debe ser mayor a 0']
    },
    imagen_url: {
        type: String,
        default: 'products/default-product.png'
    },
    estado: {
        type: String,
        enum: ['Disponible', 'Agotado', 'Descontinuado'],
        default: 'Disponible'
    },
    ProductStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

productSchema.index({ nombre: 1, categoria: 1, ProductStatus: 1 });

export default mongoose.model('Product', productSchema);