const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { propertyTypes } = db;

module.exports = {
  list: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;

      let whereClause = {};
      if (search) whereClause.title = { [Op.like]: `%${search}%` };
      if (status !== undefined) whereClause.status = status;

      const { count, rows } = await propertyTypes.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'Property types fetched', {
        list: rows,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  create: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        title: 'required|string'
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      let icon = null;
      if (req.files && req.files.image) {
        icon = await helper.fileUpload(req.files.image, 'propertyTypes');
      }

      const item = await propertyTypes.create({
        title: req.body.title,
        icon,
        status: req.body.status || 'Active',
      });

      return helper.success(res, 'Property type created successfully', item);
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await propertyTypes.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Property type not found');

      const updateData = {};
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      
      if (req.files && req.files.image) {
        updateData.icon = await helper.fileUpload(req.files.image, 'propertyTypes');
      }

      await item.update(updateData);
      return helper.success(res, 'Property type updated successfully', item);
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await propertyTypes.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Property type not found');
      await item.destroy();
      return helper.success(res, 'Property type deleted successfully');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await propertyTypes.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Property type not found');
      await item.update({ status: item.status === 'Active' ? 'Inactive' : 'Active' });
      return helper.success(res, 'Property type status toggled');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
