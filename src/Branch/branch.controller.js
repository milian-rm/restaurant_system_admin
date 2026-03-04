'use strict';

import Branch from './branch.model.js';

// TODOS (admin puede ver ACTIVE/INACTIVE si manda query)
export const getBranches = async (req, res) => {
  try {
    const { zone, branchStatus } = req.query;

    const filter = {};
    filter.branchStatus = branchStatus || 'ACTIVE';

    if (zone) filter.zone = parseInt(zone);

    const branches = await Branch.find(filter).sort({ zone: 1, name: 1 });

    return res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// SOLO PLATFORM_ADMIN
export const createBranch = async (req, res) => {
  try {
    if (req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const data = req.body;

    if (req.file) {
      data.Photos = [{ ImgaeURL: req.file.path }];
    }

    const branch = new Branch(data);
    await branch.save();

    return res.status(201).json({ success: true, data: branch });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// SOLO PLATFORM_ADMIN y BRANCH_ADMIN (BRANCH_ADMIN solo su sucursal)
export const updateBranch = async (req, res) => {
  try {
    if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;

    // Restricción: BRANCH_ADMIN solo puede modificar su sucursal
    if (req.user.role === 'BRANCH_ADMIN') {
      if (!req.user.branchId) {
        return res.status(400).json({ success: false, message: 'Tu usuario no tiene branchId asignado' });
      }
      if (req.user.branchId.toString() !== id.toString()) {
        return res.status(403).json({ success: false, message: 'No autorizado: solo puedes modificar tu sucursal' });
      }
    }

    const data = req.body;

    if (req.file) {
      data.Photos = [{ ImgaeURL: req.file.path }];
    }

    // FIX: usar data (no req.body)
    const branch = await Branch.findByIdAndUpdate(id, data, { new: true });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    return res.status(200).json({ success: true, data: branch });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// SOLO PLATFORM_ADMIN
export const changeBranchStatus = async (req, res) => {
  try {
    if (req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const { id } = req.params;
    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    branch.branchStatus = branch.branchStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    branch.deletedAt = branch.branchStatus === 'INACTIVE' ? new Date() : null;

    await branch.save();

    return res.status(200).json({
      success: true,
      message: `Branch ${branch.branchStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
      data: branch
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error changing branch status',
      error: error.message
    });
  }
};