import Coupon from './coupon.model.js';
import CouponUsage from '../CouponUsage/couponUsage.model.js';

export const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expirationDate, usageLimit } = req.body;
        const upperCode = code.toUpperCase(); 

        // 1. Validar si ya existe un cupón con ese código
        const existing = await Coupon.findOne({ code: upperCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `El código de cupón '${upperCode}' ya está registrado`
            });
        }

        // 2. Validar que la fecha no sea en el pasado
        if (new Date(expirationDate) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de expiración no puede ser anterior a hoy'
            });
        }

        const newCoupon = await Coupon.create({
            code: upperCode,
            discountPercentage,
            expirationDate,
            usageLimit
        });

        res.status(201).json({
            success: true,
            message: 'Cupón creado exitosamente',
            data: newCoupon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear el cupón',
            error: error.message
        });
    }
};

/**
 * Listar todos los cupones (Admin)
 */
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: coupons
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Actualizar cupón
 */
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Si el body trae un código, lo pasamos a mayúsculas antes de actualizar
        if (req.body.code) req.body.code = req.body.code.toUpperCase();

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { 
            new: true, 
            runValidators: true 
        });

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Cupón actualizado',
            data: updatedCoupon
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Desactivar cupón (Borrado lógico)
 */
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscamos el cupón primero para conocer su estado actual
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cupón no encontrado' 
            });
        }

        // 2. Lógica de Toggle: Si es ACTIVE pasa a INACTIVE y viceversa
        const newStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        
        // 3. Aplicamos el cambio
        coupon.status = newStatus;
        await coupon.save();

        // 4. Mensaje dinámico según la acción realizada
        const actionMessage = newStatus === 'ACTIVE' ? 'activado' : 'desactivado';

        res.status(200).json({
            success: true,
            message: `Cupón ${actionMessage} exitosamente`,
            data: coupon
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al procesar el cambio de estado del cupón',
            error: error.message 
        });
    }
};

/**
 * Ver historial de usos de un cupón específico (Admin)
 * GET /coupon/:id/usage
 * Devuelve quién usó el cupón y cuándo, paginado.
 */
export const getCouponUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip  = (page - 1) * limit;

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }

        const [usages, total] = await Promise.all([
            CouponUsage.find({ coupon: id })
                .populate('customer', 'UserName UserSurname UserEmail')
                .sort({ usedAt: -1 })
                .skip(skip)
                .limit(limit),
            CouponUsage.countDocuments({ coupon: id })
        ]);

        res.status(200).json({
            success: true,
            data: {
                coupon: { id: coupon._id, code: coupon.code },
                usages,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};