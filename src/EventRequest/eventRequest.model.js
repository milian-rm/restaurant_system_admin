'use strict';

import { Schema, model } from 'mongoose';

const eventRequestSchema = new Schema({
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
        required: true,
        trim: true,
        maxlength: 100
    },
    eventDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    numberOfPersons: {
        type: Number,
        required: true,
        min: 1
    },
    additionalServices: [{
        additionalServiceId: {
            type: Schema.Types.ObjectId,
            ref: 'AdditionalService'
        }
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['Pendiente', 'Aceptada', 'Rechazada'],
        default: 'Pendiente'
    },
    // Referencia al Event real, una vez que el admin la acepta
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

export default model('EventRequest', eventRequestSchema);