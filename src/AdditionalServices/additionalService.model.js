import { Schema, model } from 'mongoose';

const additionalServiceSchema = new Schema({
    Name: {
        type: String,
        required: [true, 'El nombre del servicio es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    Description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    AdditionalPrice: {
        type: Number,
        required: [true, 'El precio adicional es obligatorio'],
        min: [0.01, 'El precio mínimo es Q0.01'],
        max: [10000, 'El precio no puede exceder Q10,000']
    },
    image: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true,
    versionKey: false
});

additionalServiceSchema.index({ Name: 1 });

export default model('AdditionalService', additionalServiceSchema);