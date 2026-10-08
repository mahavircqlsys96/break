const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { users, services, bookings, payments, notifications, properties, bookingDates } = db;

module.exports = {

  bookingList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status;
      const paymentStatus = req.query.paymentStatus;
      const userId = req.query.userId;
      const hostId = req.query.hostId;

      const andParts = [];
      if (userId) {
        const uid = parseInt(userId, 10);
        if (!Number.isNaN(uid)) {
          andParts.push({ userId: uid });
        }
      }
      if (status) andParts.push({ status: status });
      if (search) {
        const sid = parseInt(search, 10);
        if (!Number.isNaN(sid)) {
          andParts.push({ id: sid });
        }
      }

      const whereClause = andParts.length ? { [Op.and]: andParts } : {};
      
      let propertyWhere = {};
      if (hostId) {
        const hid = parseInt(hostId, 10);
        if (!Number.isNaN(hid)) {
          propertyWhere = { hostId: hid };
        }
      }

      const { count, rows } = await bookings.findAndCountAll({
        where: whereClause,
        include: [
          { model: users, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { 
            model: properties, 
            as: 'property',
            where: Object.keys(propertyWhere).length ? propertyWhere : undefined,
            include: [{ model: users, as: 'host', attributes: ['name'] }]
          },
          { model: bookingDates, as: 'bookingDates' },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return helper.success(res, 'Bookings fetched', {
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

  bookingDetail: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await bookings.findOne({
        where: { id },
        include: [
          { model: users, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'profileImage'] },
          { 
            model: properties, 
            as: 'property',
            include: [{ model: users, as: 'host' }]
          },
          { model: bookingDates, as: 'bookingDates' },
        ]
      });

      if (!booking) return helper.failed(res, 'Booking not found');

      return helper.success(res, 'Booking detail fetched', { ...booking.toJSON(), payment: null });
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  updateBookingStatus: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        status: 'required|in:pending,accepted,completed,cancelled'
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { id } = req.params;
      const booking = await bookings.findOne({ where: { id } });
      if (!booking) return helper.failed(res, 'Booking not found');

      await booking.update({ status: req.body.status });

      return helper.success(res, 'Booking status updated');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  bookingStats: async (req, res) => {
    try {
      const [total, pending, accepted, completed, cancelled] = await Promise.all([
        bookings.count(),
        bookings.count({ where: { bookingStatus: 'pending' } }),
        bookings.count({ where: { bookingStatus: 'accepted' } }),
        bookings.count({ where: { bookingStatus: 'completed' } }),
        bookings.count({ where: { bookingStatus: 'cancelled' } }),
      ]);

      return helper.success(res, 'Booking stats fetched', { total, pending, accepted, completed, cancelled });
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
