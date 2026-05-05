'use strict';

import OrderRequest from './orderRequest.model.js';
import Order from '../Order/order.model.js';

/**
 * Ver pedidos de una sucursal
 */
export const getBranchOrderRequests = async (req, res) => {
    try {
        const { branchId } = req.params;

        const orders = await OrderRequest.find({ branch: branchId })
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
 * Actualiza estado del pedido
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

        orderRequest.orderStatus = orderStatus;
        await orderRequest.save();

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