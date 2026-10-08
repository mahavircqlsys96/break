var express = require('express');
var router = express.Router();
const authenticateAdminJWT = require('../middleware/authMiddleware').authenticateAdminJWT;

const authController = require('../controllers/admin/authController');
const cmsController = require('../controllers/admin/cmsController');
const contactUsController = require('../controllers/admin/contactUsController');
const dashboardController = require('../controllers/admin/dashboardController');
const userController = require('../controllers/admin/userController');
const bookingController = require('../controllers/admin/bookingController');
const reportController = require('../controllers/admin/reportController');
const propertyTypeController = require('../controllers/admin/propertyTypeController');
const amenityController = require('../controllers/admin/amenityController');
const animalController = require('../controllers/admin/animalController');
const propertiesController = require('../controllers/apis/propertiesController');
// ─── Public Admin Routes ───
router.post('/auth/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);

// ─── Protected Admin Routes ───
router.use(authenticateAdminJWT);

router.get('/auth/me', authController.me);

// Admin Profile
router.get('/adminProfile/:id', authController.adminProfile);
router.put('/updateProfile', authController.updateProfile);
router.put('/updatePassword', authController.updatePassword);

// Dashboard
router.get('/dashboard_data', dashboardController.dashboard_data);
router.get('/getMonthlyUserStats', dashboardController.getMonthlyUserStats);

// User Management
router.get('/userList', userController.userList);
router.get('/userList2', userController.userList2);
router.get('/userListDeleted', userController.userListDeleted);
router.get('/userFollowers/:id', userController.userFollowers);
router.get('/userFollowing/:id', userController.userFollowing);
router.get('/viewUser/:id/:role', userController.viewUser);
router.put('/toggleUserStatus/:id', userController.toggleUserStatus);
router.put('/updateApprovalStatus', userController.updateApprovalStatus);
router.delete('/deleteUser/:id', userController.deleteUser);
router.put('/restoreUser/:id', userController.restoreUser);

// CMS
router.get('/cms', cmsController.listCms);
router.get('/getCms/:slug', cmsController.getCms);
router.put('/updateCms', cmsController.updateCms);

// Contact Support
router.get('/contactUsList', contactUsController.contactUs_list);
router.get('/contactUs/:id', contactUsController.view_contactUs);
router.put('/contactUs/:id', contactUsController.update_contactUs);
router.delete('/deleteContactUs/:id', contactUsController.delete_contactUs);

// Properties
router.get('/properties', propertiesController.getProperties);
router.get('/properties/:propertyTypeId', propertiesController.propertyDetail);
router.put('/properties/:propertyTypeId', propertiesController.editProperties);

// Property Types
router.get('/propertyTypes', propertyTypeController.list);
router.post('/propertyTypes', propertyTypeController.create);
router.put('/propertyTypes/:id', propertyTypeController.update);
router.delete('/propertyTypes/:id', propertyTypeController.delete);
router.put('/propertyTypes/:id/toggle', propertyTypeController.toggleStatus);

// Amenities
router.get('/amenities', amenityController.list);
router.post('/amenities', amenityController.create);
router.put('/amenities/:id', amenityController.update);
router.delete('/amenities/:id', amenityController.delete);
router.put('/amenities/:id/toggle', amenityController.toggleStatus);

// Friendly Animals
router.get('/friendlyAnimals', animalController.list);
router.post('/friendlyAnimals', animalController.create);
router.put('/friendlyAnimals/:id', animalController.update);
router.delete('/friendlyAnimals/:id', animalController.delete);
router.put('/friendlyAnimals/:id/toggle', animalController.toggleStatus);

// Booking Management
router.get('/bookings', bookingController.bookingList);
router.get('/bookings/stats', bookingController.bookingStats);
router.get('/bookings/:id', bookingController.bookingDetail);
router.put('/bookings/:id/status', bookingController.updateBookingStatus);

// Reports
router.get('/reports', reportController.reportList);
router.put('/reports/:id', reportController.updateReportStatus);


module.exports = router;
