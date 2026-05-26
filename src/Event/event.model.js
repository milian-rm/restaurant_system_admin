import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
    branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },

    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: {
        type: String,
        required: [true, 'El nombre del evento es obligatorio'],
        trim: true,
        minlength: [5, 'El nombre debe tener al menos 5 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },

    additionalServices: [{
        additionalServiceId: {
            type: Schema.Types.ObjectId,
            ref: 'AdditionalService',
            required: false
        }
    }],

    eventDate: {
        type: Date,
        required: [true, 'La fecha del evento es obligatoria']
    },

    startTime: {
        type: String,
        required: [true, 'La hora de inicio es obligatoria']
    },

    endTime: {
        type: String,
        required: [true, 'La hora de finalización es obligatoria']
    },

    numberOfPersons: {
        type: Number,
        required: [true, 'La cantidad de personas es obligatoria'],
        min: [1, 'Debe haber al menos 1 persona'],
        max: [1000, 'El límite es 1000 personas']
    },

    tables: [{
        type: Schema.Types.ObjectId,
        ref: 'Table'
    }],

    status: {
        type: String,
        enum: ['Pendiente', 'Confirmado', 'Cancelado', 'Finalizado'],
        default: 'Pendiente'
    },

    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    }

}, {
    timestamps: true,
    versionKey: false
});

eventSchema.index({ branchId: 1, eventDate: 1 });

export default model('Event', eventSchema);