'use strict';

import Branch from './branch.model.js';

// TODOS
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

// Crear sucursal
export const createBranch = async (req, res) => {
  try {
    const data = req.body;

    if (req.file) {
      data.Photos = [{ ImageURL: req.file.path }];
    }

    const branch = new Branch(data);
    await branch.save();

    return res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Actualizar sucursal
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const data = req.body;

    if (req.file) {
      data.Photos = [{ ImageURL: req.file.path }];
    }

    const branch = await Branch.findByIdAndUpdate(id, data, {
      new: true
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Cambiar estado de sucursal
export const changeBranchStatus = async (req, res) => {
  try {
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