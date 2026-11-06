const db = require('../../models');
const helper = require('../../helpers/helper');
const { users } = db;

module.exports = {
  getSettings: async (req, res) => {
    try {
      const adminId = req.auth?.id || req.user?.id;
      let admin = null;
      if (adminId) {
        admin = await users.findOne({ where: { id: adminId } });
      }
      if (!admin) {
        admin = await users.findOne({ where: { role: 'Admin' } });
      }

      const commission = admin ? parseFloat(admin.admin_commission ?? 15) : 15;

      const data = {
        commissionPercent: isNaN(commission) ? 15 : commission,
        serviceFeePercent: 10.00,
        vatPercent: 5.00,
        cleaningFeeDefault: 150.00,
        currency: 'AED',
        supportEmail: admin?.email || 'support@break.ae',
        supportPhone: admin?.phone || '+971 4 000 0000',
        autoApproveListings: false,
        maintenanceMode: false,
        languages: ['en', 'ar'],
      };

      return helper.success(res, 'Settings fetched successfully', data);
    } catch (error) {
      console.log('Error fetching settings:', error);
      return helper.success(res, 'Settings fetched successfully', {
        commissionPercent: 15,
        serviceFeePercent: 10,
        vatPercent: 5,
        cleaningFeeDefault: 150,
        currency: 'AED',
        supportEmail: 'support@break.ae',
        supportPhone: '+971 4 000 0000',
        languages: ['en', 'ar'],
      });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const { commissionPercent } = req.body;
      const adminId = req.auth?.id || req.user?.id;

      const newCommission = commissionPercent !== undefined ? parseFloat(commissionPercent) : 15;

      const updateData = {
        admin_commission: newCommission,
      };

      if (adminId) {
        await users.update(updateData, { where: { id: adminId } });
      } else {
        await users.update(updateData, { where: { role: 'Admin' } });
      }

      return helper.success(res, 'Admin commission percentage updated successfully', {
        commissionPercent: newCommission,
      });
    } catch (error) {
      console.log('Error updating settings:', error);
      return helper.error(res, 'Failed to update admin commission');
    }
  }
};
