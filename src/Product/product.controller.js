'use strict';

import Product from './product.model.js';
import Inventory from '../Inventory/inventory.model.js';
import Branch from '../Branch/branch.model.js';
import mongoose from 'mongoose';

// Recalcula el promedio de precios de productos ACTIVE por sucursal
const updatedBranchAverage = async (branchId) => {
    const result = await Product.aggregate([
        {
            $match: {
                ProductStatus: 'ACTIVE',
                "Branches.BranchId": new mongoose.Types.ObjectId(branchId)
            }
        },
        {
            $group: {
                _id: null,
                averagePrice: { $avg: "$precio" }
            }
        }
    ]);

    const average = result.length > 0 ? result[0].averagePrice : 0;

    await Branch.findByIdAndUpdate(branchId, {
        AveragePrices: average
    });
};

// Obtener productos con filtros y paginación
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, categoria, estado, ProductStatus } = req.query;

        const filter = {};

        if (categoria) filter.categoria = categoria;
        if (estado) filter.estado = estado;
        if (ProductStatus) filter.ProductStatus = ProductStatus;

        const products = await Product.find(filter)
            .populate('ingredientes.inventoryId', 'name stock unitCost')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ nombre: 1 });

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Crear producto
export const createProduct = async (req, res) => {
    try {
        const data = req.body;

        if (!data.ingredientes || !Array.isArray(data.ingredientes) || data.ingredientes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El producto debe tener al menos un ingrediente del inventario'
            });
        }

        const branchIds = (data.Branches || []).map(b => b.BranchId);

        for (const item of data.ingredientes) {
            const inventoryItem = await Inventory.findById(item.inventoryId);

            if (!inventoryItem) {
                return res.status(404).json({
                    success: false,
                    message: `El ingrediente con ID ${item.inventoryId} no existe en el inventario`
                });
            }

            // Validar que el ingrediente pertenezca a una de las sucursales del producto
            if (branchIds.length > 0 && !branchIds.some(id => id?.toString() === inventoryItem.branchId?.toString())) {
                return res.status(400).json({
                    success: false,
                    message: `El ingrediente "${inventoryItem.name}" no pertenece al inventario de la sucursal seleccionada`
                });
            }
        }

        if (req.file) {
            data.imagen_url = req.file.path;
        }

        const product = new Product(data);
        await product.save();

        for (const branch of product.Branches) {
            await updatedBranchAverage(branch.BranchId);
        }

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Actualizar producto
export const updatedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (data.ingredientes && Array.isArray(data.ingredientes)) {
            for (const item of data.ingredientes) {
                const inventoryExists = await Inventory.findById(item.inventoryId);

                if (!inventoryExists) {
                    return res.status(404).json({
                        success: false,
                        message: `El ingrediente con ID ${item.inventoryId} no existe`
                    });
                }
            }
        }

        if (req.file) {
            data.imagen_url = req.file.path;
        }

        const updated = await Product.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        }).populate('ingredientes.inventoryId', 'name stock');

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        for (const branch of updated.Branches) {
            await updatedBranchAverage(branch.BranchId);
        }

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Soft delete toggle ACTIVE/INACTIVE
export const changeProductStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        product.ProductStatus = product.ProductStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        product.deletedAt = product.ProductStatus === 'INACTIVE' ? new Date() : null;

        await product.save();

        for (const branch of product.Branches) {
            await updatedBranchAverage(branch.BranchId);
        }

        res.status(200).json({
            success: true,
            message: `El estado del producto ha cambiado a: ${product.ProductStatus}`,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};