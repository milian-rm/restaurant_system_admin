'use strict';

import Review from './review.model.js';

/* -----------------------------------------
   OBTENER RESEÑAS POR SUCURSAL
------------------------------------------*/
export const getBranchReviews = async (req, res) => {
    try {
        const { branchId } = req.params;

        const reviews = await Review.find({
            branch: branchId,
            isDeleted: false
        })
            .populate('customer', 'UserName UserSurname')
            .populate('order', 'estado total')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas de la sucursal',
            error: error.message
        });
    }
};


/* -----------------------------------------
   ELIMINAR / RESTAURAR RESEÑA SOFT DELETE
------------------------------------------*/
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        review.isDeleted = !review.isDeleted;
        await review.save();

        const statusMessage = review.isDeleted
            ? 'eliminada (Soft Delete)'
            : 'restaurada con éxito';

        res.status(200).json({
            success: true,
            message: `Reseña ${statusMessage}`,
            data: {
                id: review._id,
                isDeleted: review.isDeleted
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al procesar el cambio de estado de la reseña',
            error: error.message
        });
    }
};