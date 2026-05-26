import { Schema, model } from 'mongoose';

const reservationSchema = new Schema({
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
    tableId: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    date: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },
    time: {
        type: String,
        required: [true, 'La hora es obligatoria']
    },
    numberOfPersons: {
        type: Number,
        required: [true, 'La cantidad de personas es obligatoria'],
        min: [1, 'Debe haber al menos 1 persona'],
        max: [50, 'El límite por reservación es 50 personas']
    },
    status: {
        type: String,
        enum: ['Confirmada', 'Pendiente', 'Cancelada', 'Completada'],
        default: 'Pendiente'
    },
    statusRes: {
        type: String,
        enum: ['ACTIVADO', 'DESACTIVADO'],
        default: 'ACTIVADO',
        uppercase: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [250, 'Las notas no pueden exceder 250 caracteres']
    }
}, {
    versionKey: false,
    timestamps: true
});

reservationSchema.index({ branchId: 1, date: 1 });
reservationSchema.index({ tableId: 1, date: 1, time: 1 });
reservationSchema.index({ statusRes: 1 });

export default model('Reservation', reservationSchema);