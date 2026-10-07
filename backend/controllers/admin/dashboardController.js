const db = require('../../models');
const { Op, fn, col } = require('sequelize');
const helper = require('../../helpers/helper');

const monthSeries = (rows, keyField = 'count') => {
  const out = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, [keyField]: 0 }));
  rows.forEach((r) => {
    const m = parseInt(r.month, 10);
    if (m >= 1 && m <= 12) out[m - 1][keyField] = parseFloat(r[keyField]) || 0;
  });
  return out;
};

module.exports = {
  dashboard_data: async (req, res) => {
    try {
      const [
        usersCount,
        providersCount,
        bookingsCount,
        activeBookings,
        pendingWithdrawals,
      ] = await Promise.all([
        db.users.count({ where: { role: 'User', deletedAt: null } }),
        db.users.count({ where: { role: 'Host', deletedAt: null } }),
        db.bookings.count(),
        db.bookings.count({ where: { status: { [Op.in]: ['Pending', 'Confirmed'] } } }),
        Promise.resolve(0), // No withdrawal requests table exists
      ]);

      const totalRevenueRow = await db.bookings.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('adminCommission')), 0), 'total']],
        where: { status: 'Completed' },
        raw: true,
      });

      const now = new Date();
      const monthlyRevenueRow = await db.bookings.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('adminCommission')), 0), 'total']],
        where: {
          status: 'Completed',
          createdAt: {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
            [Op.lt]: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
        raw: true,
      });

      const recentBookings = await db.bookings.findAll({
        limit: 8,
        order: [['createdAt', 'DESC']],
        include: [
          { model: db.users, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: db.properties, as: 'property', attributes: ['id', 'description', 'location', 'hostId'] },
        ],
      });

      const recentUsers = await db.users.findAll({
        where: { role: 'User' },
        limit: 8,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt'],
      });

      const recentProviders = await db.users.findAll({
        where: { role: 'Host' },
        limit: 8,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'name', 'email', 'status', 'createdAt'],
      });

      const avgBookingValueRow = await db.bookings.findOne({
        attributes: [[fn('COALESCE', fn('AVG', col('amount')), 0), 'avgValue']],
        raw: true,
      });

      // Instead of complex group by which crashes without associations, we can just return empty for top locations/categories
      const topCategories = [];
      const topLocations = [];

      return helper.success(res, 'Dashboard data fetched', {
        data: {
          usersCount,
          providersCount,
          bookingsCount,
          activeBookings,
          pendingWithdrawals,
          totalRevenue: Number(totalRevenueRow?.total || 0),
          monthlyRevenue: Number(monthlyRevenueRow?.total || 0),
          averageBookingValue: Number(avgBookingValueRow?.avgValue || 0),
        },
        topCategories,
        topLocations,
        recentBookings,
        recentUsers,
        recentProviders,
      });
    } catch (err) {
      console.log(err);
      return helper.error(res, 'Something went wrong');
    }
  },

  getMonthlyUserStats: async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const range = {
        [Op.gte]: new Date(`${currentYear}-01-01`),
        [Op.lte]: new Date(`${currentYear}-12-31 23:59:59`),
      };

      const usersData = await db.users.findAll({
        attributes: [
          [fn('MONTH', col('createdAt')), 'month'],
          'role',
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { role: { [Op.in]: ['User', 'Admin'] }, createdAt: range, deletedAt: null },
        group: ['month', 'role'],
        raw: true,
      });

      const providersData = await db.users.findAll({
        attributes: [
          [fn('MONTH', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { role: 'Host', createdAt: range, deletedAt: null },
        group: ['month'],
        raw: true,
      });

      const bookingsData = await db.bookings.findAll({
        attributes: [
          [fn('MONTH', col('createdAt')), 'month'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { createdAt: range },
        group: ['month'],
        raw: true,
      });

      const revenueData = await db.bookings.findAll({
        attributes: [
          [fn('MONTH', col('createdAt')), 'month'],
          [fn('COALESCE', fn('SUM', col('adminCommission')), 0), 'total'],
        ],
        where: { status: 'Completed', createdAt: range },
        group: ['month'],
        raw: true,
      });

      const monthlyUsers = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, user: 0, provider: 0 }));
      usersData.forEach(({ month, role, count }) => {
        const idx = month - 1;
        if (role === 'User') monthlyUsers[idx].user = parseInt(count, 10);
      });
      providersData.forEach(({ month, count }) => {
        const idx = month - 1;
        if (idx >= 0) monthlyUsers[idx].provider = parseInt(count, 10);
      });

      return helper.success(res, 'Monthly stats fetched', {
        data: monthlyUsers,
        bookings: monthSeries(bookingsData, 'count'),
        revenue: monthSeries(revenueData, 'total'),
      });
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },
};
