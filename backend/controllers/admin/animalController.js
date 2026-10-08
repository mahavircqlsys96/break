const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { friendlyAnimals } = db;

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

      const { count, rows } = await friendlyAnimals.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'Friendly animals fetched', {
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
        icon = await helper.fileUpload(req.files.image, 'animals');
      } else if (req.body.icon) {
        icon = req.body.icon;
      }

      const item = await friendlyAnimals.create({
        title: req.body.title,
        image: icon,
        status: req.body.status || 'Active',
      });

      return helper.success(res, 'Friendly animal created successfully', item);
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await friendlyAnimals.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Friendly animal not found');

      const updateData = {};
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      
      if (req.files && req.files.image) {
        updateData.image = await helper.fileUpload(req.files.image, 'animals');
      } else if (req.body.icon !== undefined) {
        updateData.image = req.body.icon;
      }

      await item.update(updateData);
      return helper.success(res, 'Friendly animal updated successfully', item);
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await friendlyAnimals.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Friendly animal not found');
      await item.destroy();
      return helper.success(res, 'Friendly animal deleted successfully');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await friendlyAnimals.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Friendly animal not found');
      await item.update({ status: item.status === 'Active' ? 'Inactive' : 'Active' });
      return helper.success(res, 'Friendly animal status toggled');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
