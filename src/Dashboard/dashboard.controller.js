'use strict';

import Order from '../Order/order.model.js';
import Billing from '../Billing/billing.model.js';
import User from '../User/user.model.js';
import Table from '../Table/table.model.js';
import Reservation from '../Reservation/reservation.model.js';
import Review from '../Review/review.model.js';

export const getDashboardSummary = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfDay);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);

        // Ventas de hoy (facturas PAYED)
        const todayBillings = await Billing.find({
            BillStatus: 'PAYED',
            BillDate: { $gte: startOfDay, $lte: endOfDay }
        });
        const todaySales = todayBillings.reduce((sum, b) => sum + (b.BillTotal || 0), 0);

        // Ventas de ayer (para calcular variación)
        const yesterdayBillings = await Billing.find({
            BillStatus: 'PAYED',
            BillDate: { $gte: startOfYesterday, $lte: endOfYesterday }
        });
        const yesterdaySales = yesterdayBillings.reduce((sum, b) => sum + (b.BillTotal || 0), 0);
        const salesVariation = yesterdaySales > 0
            ? (((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1)
            : null;

        // Órdenes activas (Pendiente o En Preparacion)
        const activeOrders = await Order.countDocuments({
            estado: { $in: ['Pendiente', 'En Preparacion'] }
        });

        // Reservaciones de hoy
        const todayReservations = await Reservation.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Confirmada', 'Pendiente'] }
        });

        // Calificación global promedio
        const reviewAgg = await Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
        ]);
        const avgRating = reviewAgg.length > 0 ? parseFloat(reviewAgg[0].avgRating.toFixed(1)) : 0;
        const totalReviews = reviewAgg.length > 0 ? reviewAgg[0].total : 0;

        // Total de usuarios registrados
        const totalUsers = await User.countDocuments({ status: true });

        // Total de mesas
        const totalTables = await Table.countDocuments();

        res.status(200).json({
            ok: true,
            summary: {
                todaySales,
                salesVariation,
                activeOrders,
                todayReservations,
                avgRating,
                totalReviews,
                totalUsers,
                totalTables,
            }
        });
    } catch (error) {
        console.error('Error en getDashboardSummary:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener el resumen del dashboard.' });
    }
};

export const getDashboardRecentOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const recentOrders = await Order.find()
            .sort({ horaPedido: -1 })
            .limit(limit)
            .populate('branchId', 'name')
            .populate('mesaId', 'tableNumber')
            .lean();

        const formatted = recentOrders.map(order => {
            const diffMs  = Date.now() - new Date(order.horaPedido).getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const timeAgo = diffMin < 1
                ? 'Ahora mismo'
                : diffMin < 60
                    ? `Hace ${diffMin} min`
                    : `Hace ${Math.floor(diffMin / 60)}h ${diffMin % 60}min`;

            return {
                _id:    order._id,
                id:     `ORD-${order._id.toString().slice(-4).toUpperCase()}`,
                type:   order.orderType,
                total:  order.total || 0,
                status: order.estado,
                time:   timeAgo,
                branch: order.branchId?.name || 'N/A',
                table:  order.mesaId?.tableNumber || null,
            };
        });

        res.status(200).json({ ok: true, orders: formatted });
    } catch (error) {
        console.error('Error en getDashboardRecentOrders:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener órdenes recientes.' });
    }
};

export const getDashboardUpcomingReservations = async (req, res) => {
    try {
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const upcoming = await Reservation.find({
            date: { $gte: now, $lte: endOfDay },
            status: { $in: ['Confirmada', 'Pendiente'] }
        })
            .sort({ date: 1 })
            .limit(5)
            .populate('clientId', 'UserName UserSurname')
            .populate('tableId', 'tableNumber capacity')
            .lean();

        const formatted = upcoming.map(r => ({
            _id:     r._id,
            client:  r.clientId
                ? `${r.clientId.UserName} ${r.clientId.UserSurname}`
                : 'Cliente',
            time:    r.time,
            table:   r.tableId ? `Mesa ${r.tableId.tableNumber}` : 'N/A',
            persons: r.numberOfPersons,
            status:  r.status,
        }));

        res.status(200).json({ ok: true, reservations: formatted });
    } catch (error) {
        console.error('Error en getDashboardUpcomingReservations:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener reservaciones próximas.' });
    }
};