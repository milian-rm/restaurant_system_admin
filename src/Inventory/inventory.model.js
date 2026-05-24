import { Schema, model } from 'mongoose';

const inventorySchema = Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'La sucursal es obligatoria']
    },
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        minlength: [3, 'La descripción debe tener al menos 3 caracteres'],
        maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        default: 0,
        min: [0, 'El stock no puede ser negativo'],
        max: [100000, 'El stock excede el límite permitido']
    },
    unitCost: {
        type: Number,
        required: [true, 'El costo unitario es obligatorio'],
        min: [0, 'El costo no puede ser negativo'],
        max: [100000, 'El costo excede el límite permitido']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { versionKey: false });

export default model('Inventory', inventorySchema);