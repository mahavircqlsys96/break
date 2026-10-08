const db = require('../../models');
const { Op } = require('sequelize');
const helper = require('../../helpers/helper');
const { users, reportUser } = db;

module.exports = {

  reportList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      //  type: DataTypes.ENUM('Pending','Reviewed','Resolved','Rejected'),

      let whereClause = {};
      if (status) whereClause.status = status;

      const { count, rows } = await reportUser.findAndCountAll({
        where: whereClause,
        include: [
          { model: users, as: 'reporter', attributes: ['id', 'name', 'email', 'role'] },
          { model: users, as: 'reportedUser', attributes: ['id', 'name', 'email', 'role'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return helper.success(res, 'Reports fetched', {
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

  updateReportStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      const report = await reportUser.findOne({ where: { id } });
      if (!report) return helper.failed(res, 'Report not found');

      await report.update({ status: status || 'resolved', adminRemarks: adminNote });
      return helper.success(res, 'Report updated');
    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  }
};
