var express = require('express');
var router = express.Router();
const authenticateHeader = require('../middleware/authMiddleware').authenticateHeader;
const authenticateJWT = require('../middleware/authMiddleware').authenticateJWT;
const optionalAuthenticateJWT = require('../middleware/authMiddleware').optionalAuthenticateJWT;

const authController = require('../controllers/apis/authController');
const userController = require('../controllers/apis/userController');
const hostController = require('../controllers/apis/hostController');
const propertiesController = require('../controllers/apis/propertiesController')
const bookingController = require('../controllers/apis/bookingController');

module.exports = (io) => {

  // ─── Public Routes ───
  router.get('/encryption', authController.encryption);
  router.post('/fileUpload', authController.fileUpload);
  router.get('/getCms', authController.getCms);
  router.get('/resetPasswordPage', authController.resetPasswordPage);
  router.post('/resetPassword', authController.resetPassword);

  // ─── Header Auth ───
  router.use(authenticateHeader);
  router.post('/sendOtp', authController.sendOtp);
  router.post('/verifyOtp', authController.verifyOtp);
  router.post('/socialLogin', authController.socialLogin);
  router.post('/guestLogin', authController.guestLogin);
  router.post('/forgotPassword', authController.forgotPassword);

  // ─── Optional JWT Auth ───
  router.get('/home', optionalAuthenticateJWT, userController.home);


  // ─── JWT Auth ───
  router.use(authenticateJWT);

  // Auth
  router.post('/logout', authController.logout);
  router.delete('/accountDeleted', authController.accountDeleted);
  router.patch('/notificationOnOff', authController.notificationOnOff);
  router.put('/completeProfile', authController.completeProfile);
  router.get('/getProfile', authController.getProfile);
  router.put('/editProfile', authController.editProfile);
  router.put('/setAccountType', authController.setAccountType);
  router.put('/updatePermissions', authController.updatePermissions);
  router.get('/getPropertyTypes', authController.getPropertyTypes);
  router.post('/contactUs', authController.contactUs);
  router.get('/notificationList', authController.notificationList);
  router.delete('/clearNotification', authController.clearNotification);

  router.get('/hostHome', hostController.hostHome);

  ///properites///
  router.post('/addProperties', propertiesController.addProperties);
  router.put('/editProperties', propertiesController.editProperties);
  router.get('/getProperties', propertiesController.getProperties);
  router.get('/propertyDetail/:propertyId', propertiesController.propertyDetail)
  router.get('/getPropertyReviews/:propertyId', propertiesController.getPropertyReviews)
  router.delete('/deleteProperty/:propertyId', propertiesController.deleteProperty)


  // Bookings
  router.post('/createBooking', bookingController.createBooking);
  router.post('/acceptRejectRequest', bookingController.acceptRejectRequest);
  router.post('/providerCounterOffer', bookingController.providerCounterOffer);
  router.post('/userRespondToCounterOffer', bookingController.userRespondToCounterOffer);
  router.post('/payBooking', bookingController.payBooking);
  router.get('/getUserBookings', bookingController.getUserBookings);
  router.get('/getProviderBookings', bookingController.getProviderBookings);
  router.get('/getBookingDetail/:id', bookingController.getBookingDetail);
  router.put('/updateBookingStatus', bookingController.updateBookingStatus);
  router.post('/giveRating', bookingController.giveRating);
  router.get('/providerRatingList', bookingController.providerRatingList);


  return router;
};
