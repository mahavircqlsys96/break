const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { hostResources } = db;

module.exports = {
  list: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const type = req.query.type;

      let whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { subtitle: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } }
        ];
      }
      if (status !== undefined && status !== 'all' && status !== '') {
        whereClause.status = status;
      }
      if (type && type !== 'All' && type !== 'all') {
        whereClause.type = type;
      }

      const { count, rows } = await hostResources.findAndCountAll({
        where: whereClause,
        order: [['featured', 'DESC'], ['createdAt', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'Host resources fetched', {
        list: rows,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.log('HOST RESOURCES LIST ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  create: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        title: 'required|string',
        type: 'required|string'
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      let image = null;
      if (req.files && req.files.image) {
        image = await helper.fileUpload(req.files.image, 'resources');
      } else if (req.body.image) {
        image = req.body.image;
      }

      const item = await hostResources.create({
        title: req.body.title,
        type: req.body.type || 'Hosting resources',
        subtitle: req.body.subtitle || null,
        content: req.body.content || null,
        readTime: req.body.readTime || '3 min read',
        icon: req.body.icon || 'BookOpen',
        image,
        featured: req.body.featured === true || req.body.featured === 'true' || req.body.featured === 1,
        status: req.body.status || 'Active'
      });

      return helper.success(res, 'Host resource created successfully', item);
    } catch (error) {
      console.log('HOST RESOURCE CREATE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await hostResources.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Host resource not found');

      const updateData = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.type !== undefined) updateData.type = req.body.type;
      if (req.body.subtitle !== undefined) updateData.subtitle = req.body.subtitle;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.readTime !== undefined) updateData.readTime = req.body.readTime;
      if (req.body.icon !== undefined) updateData.icon = req.body.icon;
      if (req.body.featured !== undefined) {
        updateData.featured = req.body.featured === true || req.body.featured === 'true' || req.body.featured === 1;
      }
      if (req.body.status !== undefined) updateData.status = req.body.status;

      if (req.files && req.files.image) {
        updateData.image = await helper.fileUpload(req.files.image, 'resources');
      } else if (req.body.image !== undefined) {
        updateData.image = req.body.image;
      }

      await item.update(updateData);
      return helper.success(res, 'Host resource updated successfully', item);
    } catch (error) {
      console.log('HOST RESOURCE UPDATE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await hostResources.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Host resource not found');
      await item.destroy();
      return helper.success(res, 'Host resource deleted successfully');
    } catch (error) {
      console.log('HOST RESOURCE DELETE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await hostResources.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'Host resource not found');
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await item.update({ status: newStatus });
      return helper.success(res, 'Status updated successfully', { status: newStatus });
    } catch (error) {
      console.log('HOST RESOURCE TOGGLE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
