const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { promoCodes } = db;

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try {
    if (promoCodes && typeof promoCodes.sync === 'function') {
      await promoCodes.sync();
    }
    if (db.sequelize) {
      const [cols] = await db.sequelize.query("SHOW COLUMNS FROM `bookings` LIKE 'promoCode'");
      if (cols.length === 0) {
        await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `promoCode` VARCHAR(50) NULL DEFAULT NULL AFTER `noOfDays`");
        await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `promoDiscount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `promoCode`");
        await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `originalAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `promoDiscount`");
        console.log('Added promoCode columns to bookings table.');
      }
    }
    tablesEnsured = true;
  } catch (e) {
    console.log('ensureTables warning:', e.message);
  }
}

module.exports = {
  list: async (req, res) => {
    try {
      await ensureTables();

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const discountType = req.query.discountType;

      let whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { code: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      if (status && status !== 'all' && status !== '') {
        whereClause.status = status;
      }
      if (discountType && discountType !== 'all' && discountType !== '') {
        whereClause.discountType = discountType;
      }

      const { count, rows } = await promoCodes.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'Promo codes fetched', {
        list: rows,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.log('PROMO CODES LIST ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await promoCodes.findByPk(id);
      if (!item) return helper.failed(res, 'Promo code not found');
      return helper.success(res, 'Promo code fetched', item);
    } catch (error) {
      console.log('PROMO CODE DETAIL ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  create: async (req, res) => {
    try {
      await ensureTables();

      const v = new Validator(req.body, {
        code: 'required|string',
        discountType: 'required|in:percentage,fixed',
        discountValue: 'required|numeric'
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const codeClean = String(req.body.code).trim().toUpperCase();

      const existing = await promoCodes.findOne({
        where: { code: codeClean }
      });
      if (existing) {
        return helper.failed(res, `Promo code "${codeClean}" already exists`);
      }

      const created = await promoCodes.create({
        code: codeClean,
        title: req.body.title || null,
        description: req.body.description || null,
        discountType: req.body.discountType || 'percentage',
        discountValue: parseFloat(req.body.discountValue) || 0,
        minBookingAmount: parseFloat(req.body.minBookingAmount) || 0,
        maxDiscount: req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        usageLimit: parseInt(req.body.usageLimit, 10) || 0,
        usedCount: 0,
        status: req.body.status === 'Inactive' ? 'Inactive' : 'Active'
      });

      return helper.success(res, 'Promo code created successfully', created);
    } catch (error) {
      console.log('CREATE PROMO CODE ERROR:', error);
      return helper.error(res, error.message || 'Something went wrong');
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await promoCodes.findByPk(id);
      if (!item) return helper.failed(res, 'Promo code not found');

      if (req.body.code) {
        const codeClean = String(req.body.code).trim().toUpperCase();
        const existing = await promoCodes.findOne({
          where: { code: codeClean, id: { [Op.ne]: id } }
        });
        if (existing) {
          return helper.failed(res, `Promo code "${codeClean}" already exists`);
        }
        item.code = codeClean;
      }

      if (req.body.title !== undefined) item.title = req.body.title;
      if (req.body.description !== undefined) item.description = req.body.description;
      if (req.body.discountType !== undefined) item.discountType = req.body.discountType;
      if (req.body.discountValue !== undefined) item.discountValue = parseFloat(req.body.discountValue);
      if (req.body.minBookingAmount !== undefined) item.minBookingAmount = parseFloat(req.body.minBookingAmount);
      if (req.body.maxDiscount !== undefined) {
        item.maxDiscount = req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : null;
      }
      if (req.body.startDate !== undefined) {
        item.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      }
      if (req.body.endDate !== undefined) {
        item.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
      }
      if (req.body.usageLimit !== undefined) item.usageLimit = parseInt(req.body.usageLimit, 10) || 0;
      if (req.body.status !== undefined) item.status = req.body.status;

      await item.save();

      return helper.success(res, 'Promo code updated successfully', item);
    } catch (error) {
      console.log('UPDATE PROMO CODE ERROR:', error);
      return helper.error(res, error.message || 'Something went wrong');
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await promoCodes.findByPk(id);
      if (!item) return helper.failed(res, 'Promo code not found');

      await item.destroy();
      return helper.success(res, 'Promo code deleted successfully');
    } catch (error) {
      console.log('DELETE PROMO CODE ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await promoCodes.findByPk(id);
      if (!item) return helper.failed(res, 'Promo code not found');

      item.status = item.status === 'Active' ? 'Inactive' : 'Active';
      await item.save();

      return helper.success(res, `Promo code marked as ${item.status}`, item);
    } catch (error) {
      console.log('TOGGLE PROMO CODE STATUS ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  validatePromo: async (req, res) => {
    try {
      const { code, bookingAmount } = req.body;
      if (!code) return helper.failed(res, 'Promo code is required');

      const amount = parseFloat(bookingAmount) || 0;
      const promo = await promoCodes.findOne({
        where: { code: String(code).trim().toUpperCase() }
      });

      if (!promo) return helper.failed(res, 'Invalid promo code');
      if (promo.status !== 'Active') return helper.failed(res, 'This promo code is currently inactive');

      const now = new Date();
      if (promo.startDate && new Date(promo.startDate) > now) {
        return helper.failed(res, 'This promo code is not active yet');
      }
      if (promo.endDate && new Date(promo.endDate) < now) {
        return helper.failed(res, 'This promo code has expired');
      }

      if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
        return helper.failed(res, 'This promo code usage limit has been reached');
      }

      if (promo.minBookingAmount > 0 && amount < parseFloat(promo.minBookingAmount)) {
        return helper.failed(
          res,
          `Minimum booking amount of AED ${promo.minBookingAmount} required for this promo code`
        );
      }

      let discount = 0;
      if (promo.discountType === 'percentage') {
        discount = (amount * parseFloat(promo.discountValue)) / 100;
        if (promo.maxDiscount && discount > parseFloat(promo.maxDiscount)) {
          discount = parseFloat(promo.maxDiscount);
        }
      } else {
        discount = parseFloat(promo.discountValue);
      }

      if (discount > amount) discount = amount;
      const finalAmount = Math.max(0, amount - discount);

      return helper.success(res, 'Promo code applied successfully', {
        promoCode: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: discount,
        originalAmount: amount,
        finalAmount: finalAmount
      });
    } catch (error) {
      console.log('VALIDATE PROMO ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
