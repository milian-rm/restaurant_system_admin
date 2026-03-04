'use strict';

import OrderRequest from './orderRequest.model.js';
import Order from '../Order/order.model.js';

/**
 * PERSONAL / ADMIN
 * Ver pedidos de una sucursal
 * - PLATFORM_ADMIN: puede consultar cualquier sucursal (usa branchId del params)
 * - BRANCH_ADMIN / EMPLOYEE: solo puede consultar su propia sucursal (ignora branchId del params)
 */
export const getBranchOrderRequests = async (req, res) => {
    try {
        const { branchId } = req.params;

        const userRole = req.user.role;

        // Si es admin de sucursal o empleado, forzamos a su sucursal
        const effectiveBranchId =
            (userRole === 'BRANCH_ADMIN' || userRole === 'EMPLOYEE')
                ? req.user.branchId
                : branchId;

        const orders = await OrderRequest.find({ branch: effectiveBranchId })
            .populate('customer', 'UserName UserSurname UserEmail')
            .populate('order')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching branch orders',
            error: error.message
        });
    }
};

/**
 * PERSONAL actualiza estado del pedido
 * - Evita cambios si ya está finalizado (Cancelado / Entregado)
 * - Valida transición de estados
 * - Sincroniza estado con la Order interna
 * - BRANCH_ADMIN / EMPLOYEE solo pueden modificar pedidos de su sucursal
 */
export const updateOrderRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const orderRequest = await OrderRequest.findById(id);

        if (!orderRequest) {
            return res.status(404).json({
                success: false,
                message: 'Order request no encontrada'
            });
        }

        // Seguridad por sucursal
        if (['BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            if (orderRequest.branch?.toString() !== req.user.branchId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado (pedido de otra sucursal)'
                });
            }
        }

        // Bloquear si ya está finalizada
        if (orderRequest.orderStatus === 'Cancelado' || orderRequest.orderStatus === 'Entregado') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un pedido finalizado'
            });
        }

        const validTransitions = {
            'Pendiente': ['En Preparacion', 'Cancelado'],
            'En Preparacion': ['Listo'],
            'Listo': ['Entregado'],
            'Entregado': [],
            'Cancelado': []
        };

        const allowed = validTransitions[orderRequest.orderStatus];

        if (!allowed || !allowed.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Transición inválida de ${orderRequest.orderStatus} a ${orderStatus}`
            });
        }

        // Actualizar OrderRequest
        orderRequest.orderStatus = orderStatus;
        await orderRequest.save();

        // Sincronizar con Order interna
        await Order.findByIdAndUpdate(orderRequest.order, {
            estado: orderStatus
        });

        const updatedOrder = await OrderRequest.findById(id)
            .populate('customer')
            .populate('order')
            .populate('branch');

        res.status(200).json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: updatedOrder
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message
        });
    }
};