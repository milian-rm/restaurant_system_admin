'use strict';

import Review from './review.model.js';

/* -----------------------------------------
   OBTENER RESEÑAS POR SUCURSAL (ADMIN)
   - PLATFORM_ADMIN: puede ver cualquier sucursal
   - BRANCH_ADMIN / EMPLOYEE: solo puede ver su propia sucursal
------------------------------------------*/
export const getBranchReviews = async (req, res) => {
    try {
        const { branchId } = req.params;

        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (!req.user.branchId) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario no tiene branchId asignado'
                });
            }
            if (branchId?.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado para ver reseñas de otra sucursal'
                });
            }
        }

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
   ELIMINAR / RESTAURAR RESEÑA (SOFT DELETE) (ADMIN)
   - PLATFORM_ADMIN: puede modificar cualquiera
   - BRANCH_ADMIN: solo si la reseña pertenece a su sucursal
------------------------------------------*/
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        const isPlatformAdmin = userRole === 'PLATFORM_ADMIN';
        const isBranchAdmin =
            userRole === 'BRANCH_ADMIN' &&
            review.branch?.toString() === req.user.branchId?.toString();

        if (!isPlatformAdmin && !isBranchAdmin) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar el estado de esta reseña'
            });
        }

        review.isDeleted = !review.isDeleted;
        await review.save();

        const statusMessage = review.isDeleted ? 'eliminada (Soft Delete)' : 'restaurada con éxito';

        res.status(200).json({
            success: true,
            message: `Reseña ${statusMessage} por ${userRole}`,
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