const envfile = process.env;
let CryptoJS = require("crypto-js");
const crypto = require('crypto');
const helper = require("../../helpers/helper");
const { Validator } = require("node-input-validator");
const moment = require('moment');
const path = require("path");
var bcrypt = require('bcrypt');
const sequelize = require("sequelize");
const Op = sequelize.Op;

let jwt = require("jsonwebtoken");
const { req } = require("express");
const stripe = require("stripe")(envfile.stripe_secret_key);
const OTP_TTL_SECONDS = 60;      // screen shows 00:30 - set to 30 to match exactly
const RESEND_AFTER_SECONDS = 30;
const MAX_OTP_ATTEMPTS = 5;
const MIN_AGE = 18;

const { users,
  propertyTypes,
  friendlyAnimals,
  properties,
  amenities,
  propertiesKeyAmenities,
  propertiesPhotos,
  bookings,
  bookingDates,
  wishlists,
  chatRoom,
  messages,
  cms,
  notifications,
  contactUs,
  reviews,
  reportUser,
  propertyFriendlyAnimals } = require("../../models");


const toDate = (unix) => new Date(unix * 1000);

const issueToken = (user, loginTime) =>
  jwt.sign({ data: { id: user.id, loginTime } }, envfile.crypto_key, { expiresIn: "30d" });

const sanitizeUser = (user) => {
  const obj = user.toJSON();
  ["otp", "otpExpiresAt", "otpAttempts", "forgotHash", "socketId"].forEach((k) => delete obj[k]);
  return obj;
};

const buildAuthResponse = (user, token) => ({ ...sanitizeUser(user), token });

const generateOtp = () =>
  process.env.NODE_ENV === "production"
    ? String(Math.floor(1000 + Math.random() * 9000))
    : "1234"; // fixed OTP for dev/testing

const isSuspended = (user) => user.status === "Inactive";
const SUSPENDED_MSG = "Your account is suspended. Please contact the admin.";

module.exports = {
  encryption: async (req, res) => {
    try {
      const v = new Validator(req.headers, {
        secret_key: "required|string",
        publish_key: "required|string",
      });

      let errorsResponse = await helper.checkValidation(v);

      if (errorsResponse) {
        return helper.failed(res, errorsResponse);
      }

      let sk_data = req.headers.secret_key;
      let pk_data = req.headers.publish_key;
      var encryptedSkBuffer = CryptoJS.AES.encrypt(
        sk_data,
        envfile.crypto_key
      ).toString();
      var encryptedPkBuffer = CryptoJS.AES.encrypt(
        pk_data,
        envfile.crypto_key
      ).toString();
      var decryptedSkBuffer = CryptoJS.AES.decrypt(
        encryptedSkBuffer,
        envfile.crypto_key
      );
      var originalskText = decryptedSkBuffer.toString(CryptoJS.enc.Utf8);
      var decryptedPkBuffer = CryptoJS.AES.decrypt(
        encryptedPkBuffer,
        envfile.crypto_key
      );
      var originalpkTextr = decryptedPkBuffer.toString(CryptoJS.enc.Utf8);

      return helper.success(res, "data", {
        encryptedSkBuffer,
        encryptedPkBuffer,
        originalskText,
        originalpkTextr,
      });
    } catch (err) {
      console.log(err, ">>>>>>>>>>");
      // return helper.failed (res, err);
    }
  },

  sendOtp: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        countryCode: "required",
        phone: "required|minLength:6|maxLength:15",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { countryCode, phone, deviceToken, deviceType } = req.body;
      const now = helper.unixTimestamp();

      let user = await users.findOne({ where: { countryCode, phone } });

      if (user && isSuspended(user)) return helper.failed(res, SUSPENDED_MSG);

      // Resend cooldown (sent time = expiry - TTL)
      if (user && user.otpExpiresAt) {
        const sentAt = Math.floor(user.otpExpiresAt.getTime() / 1000) - OTP_TTL_SECONDS;
        const wait = sentAt + RESEND_AFTER_SECONDS - now;
        if (wait > 0) {
          return helper.failed(res, `Please wait ${wait}s before requesting a new code.`);
        }
      }

      const otp = generateOtp();
      const loginTime = helper.unixTimestamp();
      const otpData = {
        otp,
        otpVerify: "no_verify",
        otpExpiresAt: toDate(now + OTP_TTL_SECONDS),
        otpAttempts: 0,
        loginTime,
        ...(deviceToken && { deviceToken }),
        ...(deviceType && { deviceType }),
      };

      if (user) await user.update(otpData);
      else user = await users.create({ countryCode, phone, role: "User", ...otpData });

      const token = issueToken(user, loginTime);

      // await helper.sendSms(`${countryCode}${phone}`, `Your Break verification code is ${otp}`);

      return helper.success(res, "Verification code sent", {
        countryCode,
        phone,
        expiresIn: OTP_TTL_SECONDS,
        resendIn: RESEND_AFTER_SECONDS,
        token,
        ...buildAuthResponse(user, token),
      });
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        countryCode: "required",
        phone: "required",
        otp: "required|length:4",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { countryCode, phone, otp, deviceToken, deviceType } = req.body;
      const now = helper.unixTimestamp();

      const user = await users.findOne({ where: { countryCode, phone } });
      if (!user || !user.otp) return helper.failed(res, "Please request a verification code first.");
      if (isSuspended(user)) return helper.failed(res, SUSPENDED_MSG);

      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        return helper.failed(res, "Too many incorrect attempts. Please request a new code.");
      }
      if (!user.otpExpiresAt || user.otpExpiresAt.getTime() / 1000 < now) {
        return helper.failed(res, "Code has expired. Please request a new one.");
      }
      if (String(otp) !== user.otp) {
        await user.increment("otpAttempts");
        return helper.failed(res, "Invalid verification code.");
      }

      let loginTime = helper.unixTimestamp();
      await user.update({
        otp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpVerify: "verify",
        loginTime: loginTime,
        deviceToken: deviceToken,
        deviceType,
      });

      const token = issueToken(user, loginTime);

      return helper.success(res, "Verification successful", {
        isNewUser: !user.name, // profile never completed
        ...buildAuthResponse(user, token),
      });
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  socialLogin: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        socialType: "required|in:Google,Apple,UAEPass",
        socialId: "required",
        // role: "required",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { socialType, socialId, deviceToken, deviceType, email, image, name } = req.body;
      let user = await users.findOne({ where: { socialType, socialId } });
      let loginTime = helper.unixTimestamp();
      // Link to an existing account with the same email
      if (!user && email) {
        user = await users.findOne({ where: { email } });
        if (user) await user.update({ socialType, socialId, loginTime: loginTime });
      }

      const isNewUser = !user;

      if (!user) {
        user = await users.create({
          role: "User",
          socialType,
          socialId: socialId,
          email: email || null,
          name: name || null, // Apple only sends name on first login
          image: image || null,
          otpVerify: "verify",
          loginTime: loginTime
        });
      } else if (isSuspended(user)) {
        return helper.failed(res, SUSPENDED_MSG);
      }

      await user.update({ loginTime: loginTime, deviceToken, deviceType });
      const token = issueToken(user, loginTime);

      return helper.success(res, "Login successful", {
        isNewUser,
        ...buildAuthResponse(user, token),
      });
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  guestLogin: async (req, res) => {
    try {
      const v = new Validator(req.body, { deviceId: "required" });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const token = jwt.sign(
        { data: { guest: true, deviceId: req.body.deviceId } },
        envfile.crypto_key,
        { expiresIn: "7d" }
      );

      return helper.success(res, "Logged in as guest", { guest: true, token });
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  completeProfile: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        name: "required|minLength:2|maxLength:50",
        gender: "required|in:Male,Female",
        dob: "required|dateFormat:YYYY-MM-DD",
        // isNotification: "required|in:On,Off",
        // isLocation: "required|in:On,Off",
        // role: "required|in:User,Host",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { name, gender, dob,
        // isNotification,
        // isLocation,
        // role,
        // location,
        // latitude,
        // longitude
      } = req.body;

      const user = req.auth;

      const updateData = {
        name: name.trim(),
        gender,
        dob,
        // isNotification,
        // isLocation,
      };

      // if (location) updateData.location = location;
      // if (latitude && longitude) {
      //   updateData.latitude = latitude;
      //   updateData.longitude = longitude;
      // }

      if (req.files && req.files.image) {
        updateData.image = await helper.fileUpload(req.files.image, "users");
      }

      // Account type can only be chosen once (during onboarding)
      if (user.onboardingStep !== "done") {
        // updateData.role = role;
        updateData.onboardingStep = "profile";
      }

      await users.update(updateData, { where: { id: user.id } });

      // Fetch the fresh row so the response has the updated values
      const updatedUser = await users.findOne({ where: { id: user.id } });

      return helper.success(res, "Profile completed", sanitizeUser(updatedUser));
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },
  updatePermissions: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        isNotification: "required|in:On,Off",
        isLocation: "required|in:On,Off",
        // latitude: "numeric",
        // longitude: "numeric",
        // location: "maxLength:500",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { isNotification, isLocation, latitude, longitude, location } = req.body;
      const user = req.auth;

      const update = {
        isNotification, isLocation, onboardingStep: "permissions"
      };

      if (isLocation === "On" && latitude && longitude) {
        update.latitude = latitude;
        update.longitude = longitude;
        if (location) update.location = location;
      }


      await users.update(update, { where: { id: user.id } });

      const updatedUser = await users.findOne({
        where: { id: user.id },
        attributes: ["isNotification", "isLocation", "latitude", "longitude", "location", "onboardingStep"],
      });

      return helper.success(res, "Permissions updated", updatedUser);
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  setAccountType: async (req, res) => {
    try {
      const v = new Validator(req.body, { role: "required|in:User,Host" });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const user = req.auth;

      // Admins are never changed through this API
      if (user.role === "Admin") {
        return helper.failed(res, "Account type can't be changed for this account.");
      }

      await users.update(
        { role: req.body.role, onboardingStep: "done" },
        { where: { id: user.id } }
      );

      const updatedUser = await users.findOne({
        where: { id: user.id },
        attributes: ["id", "role", "onboardingStep"],
      });

      return helper.success(res, "Account type saved", updatedUser);
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },
  getPropertyTypes: async (req, res) => {
    try {
      let list = await propertyTypes.findAll({
        where: { status: "Active" },
        attributes: ["id", "title", "icon"],
        order: [["id", "ASC"]],
      });

      if (!list || list.length === 0) {
        const defaults = [
          { title: "Farms", icon: "Tractor", status: "Active" },
          { title: "Vacation homes", icon: "Home", status: "Active" },
          { title: "Resorts", icon: "Palmtree", status: "Active" },
          { title: "Desert camps", icon: "Tent", status: "Active" },
        ];
        await propertyTypes.bulkCreate(defaults);
        list = await propertyTypes.findAll({
          where: { status: "Active" },
          attributes: ["id", "title", "icon"],
          order: [["id", "ASC"]],
        });
      }

      const formatted = list.map((p) => ({
        id: p.id,
        title: p.title,
        name: p.title,
        icon: p.icon,
      }));

      return helper.success(res, "Property types fetched", formatted);
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  getAmenities: async (req, res) => {
    try {
      const { type } = req.query;
      const whereClause = { status: "Active" };
      if (type && type !== "All") whereClause.type = type;

      let list = await amenities.findAll({
        where: whereClause,
        attributes: ["id", "title", "icon", "type"],
        order: [["id", "ASC"]],
      });

      if ((!list || list.length === 0) && (!type || type === "All")) {
        const defaults = [
          // Essentials
          { title: "Wi-Fi", icon: "Wifi", type: "Essentials", status: "Active" },
          { title: "Air conditioning", icon: "Snowflake", type: "Essentials", status: "Active" },
          { title: "Kitchen", icon: "CookingPot", type: "Essentials", status: "Active" },
          { title: "Washer", icon: "WashingMachine", type: "Essentials", status: "Active" },
          { title: "Dryer", icon: "WashingMachine", type: "Essentials", status: "Active" },
          { title: "Smart TV", icon: "Tv", type: "Essentials", status: "Active" },
          { title: "Iron and ironing board", icon: "Sparkles", type: "Essentials", status: "Active" },
          { title: "Towels", icon: "Sparkles", type: "Essentials", status: "Active" },
          { title: "Extra pillows and blankets", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Heating", icon: "Flame", type: "Essentials", status: "Active" },
          { title: "Room-darkening curtains", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Clothes drying rack", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Ground-floor bedroom", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Maid's room", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Driver's room", icon: "Home", type: "Essentials", status: "Active" },
          { title: "Dedicated workspace", icon: "Home", type: "Essentials", status: "Active" },
          // Kitchen & dining
          { title: "Microwave", icon: "CookingPot", type: "Kitchen & dining", status: "Active" },
          { title: "Dishwasher", icon: "WashingMachine", type: "Kitchen & dining", status: "Active" },
          { title: "Coffee maker", icon: "Coffee", type: "Kitchen & dining", status: "Active" },
          { title: "Toaster", icon: "CookingPot", type: "Kitchen & dining", status: "Active" },
          { title: "Dishes and cutlery", icon: "Utensils", type: "Kitchen & dining", status: "Active" },
          { title: "Dining table", icon: "Utensils", type: "Kitchen & dining", status: "Active" },
          { title: "Outdoor kitchen", icon: "Utensils", type: "Kitchen & dining", status: "Active" },
          // Bathroom
          { title: "Bathtub", icon: "Bath", type: "Bathroom", status: "Active" },
          { title: "Toiletries (shampoo, soap)", icon: "Bath", type: "Bathroom", status: "Active" },
          { title: "Slippers", icon: "Sparkles", type: "Bathroom", status: "Active" },
          { title: "Outdoor shower", icon: "Waves", type: "Bathroom", status: "Active" },
          // Entertainment
          { title: "Projector / home cinema", icon: "Tv", type: "Entertainment", status: "Active" },
          { title: "Outdoor cinema screen", icon: "Tv", type: "Entertainment", status: "Active" },
          { title: "Games room", icon: "Gamepad2", type: "Entertainment", status: "Active" },
          { title: "Sound system / speakers", icon: "Music", type: "Entertainment", status: "Active" },
          { title: "Karaoke", icon: "Music", type: "Entertainment", status: "Active" },
          { title: "Board games / Playstation", icon: "Gamepad2", type: "Entertainment", status: "Active" },
          // Features & Outdoor
          { title: "Swimming pool", icon: "Waves", type: "Features & Outdoor", status: "Active" },
          { title: "BBQ grill & fire pit", icon: "Flame", type: "Features & Outdoor", status: "Active" },
          { title: "Kids playground", icon: "Baby", type: "Features & Outdoor", status: "Active" },
          { title: "Garden", icon: "Trees", type: "Features & Outdoor", status: "Active" },
          { title: "Hot tub / Jacuzzi", icon: "Bath", type: "Features & Outdoor", status: "Active" },
          // Safety
          { title: "First aid kit", icon: "Cross", type: "Safety", status: "Active" },
          { title: "Smoke alarm", icon: "ShieldAlert", type: "Safety", status: "Active" },
          { title: "Fire extinguisher", icon: "Flame", type: "Safety", status: "Active" },
          { title: "Security cameras", icon: "Cctv", type: "Safety", status: "Active" },
        ];
        await amenities.bulkCreate(defaults);
        list = await amenities.findAll({
          where: whereClause,
          attributes: ["id", "title", "icon", "type"],
          order: [["id", "ASC"]],
        });
      }

      const formatted = list.map((a) => ({
        id: a.id,
        title: a.title,
        name: a.title,
        icon: a.icon,
        type: a.type || "Essentials",
      }));

      return helper.success(res, "Amenities fetched successfully", formatted);
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },

  getAnimals: async (req, res) => {
    try {
      let list = await friendlyAnimals.findAll({
        where: { status: "Active" },
        order: [["id", "ASC"]],
      });

      if (!list || list.length === 0) {
        const defaults = [
          { title: "Horses", image: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Goats", image: "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Rabbits", image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Chickens", image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Camels", image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Sheep", image: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Ducks", image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Pygmy Goats", image: "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Dogs", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Cats", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80", status: "Active" },
          { title: "Birds", image: "https://images.unsplash.com/photo-1452570053593-1b910e787d60?w=150&auto=format&fit=crop&q=80", status: "Active" },
        ];
        await friendlyAnimals.bulkCreate(defaults);
        list = await friendlyAnimals.findAll({
          where: { status: "Active" },
          order: [["id", "ASC"]],
        });
      }

      const formatted = list.map((a) => ({
        id: a.id,
        title: a.title,
        name: a.title,
        image: a.image || a.icon,
        icon: a.image || a.icon,
      }));

      return helper.success(res, "Friendly animals fetched successfully", formatted);
    } catch (err) {
      console.log(err);
      return helper.error(res, err);
    }
  },


  logout: async (req, res) => {
    try {
      let time = helper.unixTimestamp();
      const logout = await users.update(
        {
          loginTime: time,
          deviceToken: null
        },
        {
          where: {
            id: req.auth.id,
          },
        }
      );
      return helper.success(res, "Logout Successfully");
    } catch (error) {
      return helper.error(res, error);
    }
  },
  accountDeleted: async (req, res) => {
    try {
      const find_user = await users.findOne({
        where: {
          id: req.auth.id,

        },
        raw: true,
        nest: true,
      });
      if (find_user) {

        let User = users.destroy(

          {
            where: {
              id: req.auth.id,
            },
          }
        );
        return helper.success(res, "Account deleted succesfully!");
      } else {
        return helper.failed(res, "Account not found ");
      }
    } catch (error) {

      return helper.error(res, error);
    }
  },

  notificationOnOff: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        isNotification: "required|in:on,off", //0=>off,1=>on
      });

      let errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      const update = await users.update(req.body, {
        where: {
          id: req.auth.id,
        },
        raw: true,
      });
      let updateduser = await users.findOne({
        where: {
          id: req.auth.id,
        },
        attributes: ["id", "isNotification"],
        raw: true,
        nest: true,
      });
      updateduser.password = undefined;
      updateduser.otp = undefined;
      return helper.success(res, "Notification setting updated successfully", updateduser);
    }
    catch (error) {
      return helper.error(res, error);
    }
  },
  getProfile: async (req, res) => {
    try {
      const userId = req.query.userId || req.auth.id;

      const user = await users.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "name",
          "email",
          "countryCode",
          "phone",
          "image",
          "isNotification",
          "onboardingStep",
          "status",
          "latitude",
          "longitude",
          "location",
          "isLocation",
          "gender",
          "dob",
        ]
      });

      if (!user) {
        return helper.failed(res, "User not found");
      }


      return helper.success(
        res,
        "User Profile retrieved successfully",
        user
      );

    } catch (error) {
      return helper.error(res, error.message);
    }
  },
  editProfile: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        name: "minLength:2|maxLength:50",
        email: "email|maxLength:255",
        countryCode: "maxLength:10",
        phone: "minLength:6|maxLength:15",
        gender: "in:Male,Female",
        // dob: "dateFormat:YYYY-MM-DD",
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const user = req.auth;
      const userId = user.id;
      const { name, gender, dob } = req.body;
      const email = req.body.email ? req.body.email.trim().toLowerCase() : null;
      const phone = req.body.phone ? req.body.phone.trim() : null;
      const countryCode = req.body.countryCode ? req.body.countryCode.trim() : null;

      /* Email duplicate check */
      if (email && email !== user.email) {
        const emailExists = await users.findOne({
          where: { email, id: { [Op.ne]: userId } },
        });
        if (emailExists) return helper.failed(res, "Email already exists");
      }

      /* Phone duplicate check (countryCode + phone together) */
      const newCountryCode = countryCode || user.countryCode;
      const newPhone = phone || user.phone;

      if (newPhone !== user.phone || newCountryCode !== user.countryCode) {
        const phoneExists = await users.findOne({
          where: { countryCode: newCountryCode, phone: newPhone, id: { [Op.ne]: userId } },
        });
        if (phoneExists) return helper.failed(res, "Phone number already exists");
      }

      /* Prepare update data */
      const updateData = {};

      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (countryCode) updateData.countryCode = countryCode;
      if (name) updateData.name = name.trim();
      if (gender) updateData.gender = gender;
      if (dob) updateData.dob = dob;


      if (req.files && req.files.image) {
        updateData.image = await helper.fileUpload(req.files.image, "users");
      }

      if (Object.keys(updateData).length === 0) {
        return helper.failed(res, "Nothing to update");
      }

      await users.update(updateData, { where: { id: userId } });

      /* Fetch updated user */
      const updatedUser = await users.findOne({ where: { id: userId } });

      return helper.success(res, "Profile updated successfully", sanitizeUser(updatedUser));
    } catch (error) {
      console.error("EDIT PROFILE ERROR:", error);
      return helper.error(res, error);
    }
  },
  /////////

  fileUpload: async (req, res) => {
    try {
      let folder = "users";
      let fileData = null;

      if (req.files && req.files.file) {
        fileData = await helper.fileUpload(req.files.file, folder);
      } else {
        return helper.failed(res, "No file uploaded");
      }

      return helper.success(res, "File uploaded successfully", {
        file: fileData,
      });
    } catch (error) {
      console.log(error);

      return helper.error(res, "Error occurred during file upload");
    }
  },

  getCms: async (req, res) => {
    try {
      const pageType = req.query.slug;

      const cmsData = await cms.findOne({
        where: { slug: pageType },
      });

      if (!cmsData) {
        return helper.failed(res, "CMS page not found");
      }

      return helper.success(res, "CMS page retrieved successfully", cmsData);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
  contactUs: async (req, res) => {
    const v = new Validator(req.body, {
      name: "required",
      email: "required|email",
      message: "required",
    });

    let errorsResponse = await helper.checkValidation(v);
    if (errorsResponse) return helper.failed(res, errorsResponse);
    const user = await users.findOne({
      where: {
        id: req.auth.id,
      },
      raw: true,
      nest: true,
    });
    const supportData = await contactUs.create({
      userId: req.auth.id,
      name: user.name,
      email: user.email,
      message: req.body.message,
    });
    return helper.success(res, "Support request received", supportData);
  },
  notificationList: async (req, res) => {
    try {

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const offset = (page - 1) * limit;

      const whereCondition = {
        senderId: req.auth.id,

      };

      const { count, rows } = await notifications.findAndCountAll({
        where: whereCondition,

        order: [["createdAt", "DESC"]],
        limit,
        offset,
        distinct: true // 🔥 important when using include
      });

      return helper.success(
        res,
        "Notifications list fetched successfully",
        {
          total: count,
          page,
          limit,
          total_pages: Math.ceil(count / limit),
          data: rows
        }
      );

    } catch (error) {
      console.error("Error in notifications_list:", error);
      return helper.error(res, error.message || "Internal server error");
    }
  },
  clearNotification: async (req, res) => {
    try {

      await notifications.destroy({
        where: {
          senderId: req.auth.id
        }
      });

      return helper.success(res, "Notification deleted");

    } catch (error) {
      console.log(error);
      return helper.error(res, error);
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        email: "required|email",
      });

      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      const { email } = req.body;

      const user = await users.findOne({ where: { email } });
      if (!user) {
        return helper.failed(res, "Email not registered");
      }

      // 🔹 Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = moment().add(30, "minutes").toDate();

      // 🔹 Save token
      await users.update(
        {
          resetToken: token,
          resetTokenExpiry: expiry
        },
        { where: { id: user.id } }
      );

      // 🔹 Reset password link
      const resetLink = `${envfile.BASE_URL}resetPasswordPage?token=${token}`;

      const emailSubject = "Reset Your Muulahub Account Password";

      const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px;background:#ffffff;border-radius:8px;
          box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:30px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="color:#2c3e50;margin:0;">Muulahub</h2>
              <p style="color:#888;margin-top:5px;">Secure Account Access</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#333;font-size:15px;line-height:1.6;">
              <p>Hello <strong>${user.name || "User"}</strong>,</p>

              <p>
                We received a request to reset your password for your
                Muulahub account. Click the button below to set a new password.
              </p>

              <p style="text-align:center;margin:30px 0;">
                <a href="${resetLink}"
                  style="background:#4F46E5;color:#ffffff;text-decoration:none;
                  padding:14px 28px;border-radius:6px;font-weight:bold;
                  display:inline-block;">
                  Reset Password
                </a>
              </p>

              <p>
                This password reset link will expire in
                <strong>30 minutes</strong>.
              </p>

              <p>
                If you did not request a password reset, please ignore this
                email or contact our support team.
              </p>

              <p style="margin-top:30px;">
                Regards,<br/>
                <strong>Muulahub Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;color:#999;font-size:12px;">
              © ${new Date().getFullYear()} Muulahub. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


      await helper.sendEmail(email, emailSubject, emailBody);
      return helper.success(
        res,
        "Password reset link sent to your registered email"
      );

    } catch (error) {
      console.error(error);
      return helper.error(res, error);
    }
  },
  resetPasswordPage: async (req, res) => {
    try {
      let token = req.query.token

      res.render("reset_password", { token });

    } catch (err) {
      console.error(err);
      res.render("reset-password", {
        error: "Something went wrong. Please try again."
      });
    }
  },
  resetPassword: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        token: "required",
        password: "required",
      });

      const errorsResponse = await helper.checkValidation(v);
      if (errorsResponse) return helper.failed(res, errorsResponse);

      const { token, password } = req.body;

      const user = await users.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        res.render("expired", {});
      }

      // 🔹 Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔹 Update password
      await users.update(
        {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        },
        { where: { id: user.id } }
      );
      res.render("sucess", {});

    } catch (error) {
      console.error(error);
      return helper.error(res, error);
    }
  },



};
