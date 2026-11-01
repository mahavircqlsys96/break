const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { faqs } = db;

module.exports = {
  list: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const category = req.query.category || req.query.type;
      const targetAudience = req.query.targetAudience;

      let whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { question: { [Op.like]: `%${search}%` } },
          { answer: { [Op.like]: `%${search}%` } },
          { section: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } }
        ];
      }
      if (status !== undefined && status !== 'all' && status !== '') {
        whereClause.status = status;
      }
      if (category && category !== 'All' && category !== 'all') {
        whereClause.category = category;
      }
      if (targetAudience && targetAudience !== 'All' && targetAudience !== 'all') {
        whereClause.targetAudience = targetAudience;
      }

      const { count, rows } = await faqs.findAndCountAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['id', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'FAQs fetched successfully', {
        list: rows,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.log('FAQS LIST ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  create: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        question: 'required|string',
        answer: 'required|string'
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const item = await faqs.create({
        question: req.body.question,
        answer: req.body.answer,
        category: req.body.category || 'Bookings & guests',
        section: req.body.section || 'General',
        targetAudience: req.body.targetAudience || 'Host',
        sortOrder: parseInt(req.body.sortOrder) || 0,
        status: req.body.status || 'Active'
      });

      return helper.success(res, 'FAQ created successfully', item);
    } catch (error) {
      console.log('FAQ CREATE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await faqs.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'FAQ not found');

      const updateData = {};
      if (req.body.question !== undefined) updateData.question = req.body.question;
      if (req.body.answer !== undefined) updateData.answer = req.body.answer;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.section !== undefined) updateData.section = req.body.section;
      if (req.body.targetAudience !== undefined) updateData.targetAudience = req.body.targetAudience;
      if (req.body.sortOrder !== undefined) updateData.sortOrder = parseInt(req.body.sortOrder) || 0;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      await item.update(updateData);
      return helper.success(res, 'FAQ updated successfully', item);
    } catch (error) {
      console.log('FAQ UPDATE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await faqs.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'FAQ not found');
      await item.destroy();
      return helper.success(res, 'FAQ deleted successfully');
    } catch (error) {
      console.log('FAQ DELETE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await faqs.findOne({ where: { id } });
      if (!item) return helper.failed(res, 'FAQ not found');
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await item.update({ status: newStatus });
      return helper.success(res, 'Status updated successfully', { status: newStatus });
    } catch (error) {
      console.log('FAQ TOGGLE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
