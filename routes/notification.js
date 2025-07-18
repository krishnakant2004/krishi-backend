const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../model/notification');
const OneSignal = require('onesignal-node');
const nodemailer = require('nodemailer');
require('dotenv').config();


const client = new OneSignal.Client(process.env.ONE_SIGNAL_APP_ID, process.env.ONE_SIGNAL_REST_API_KEY);

router.post('/send-notification', asyncHandler(async (req, res) => {
    const { title, description, imageUrl } = req.body;
    console.log(req.body);
    const notificationBody = {
        contents: {
            'en': description
        },
        headings: {
            'en': title
        },
        included_segments: ['All'],
        ...(imageUrl && { big_picture: imageUrl })
    };

    const response = await client.createNotification(notificationBody);
    console.log('Notification sent to all users:', response.body.id);
    const notificationId = response.body.id;
    console.log('Notification sent to all users:', notificationId);
    const notification = new Notification({ notificationId, title,description,imageUrl });
    const newNotification = await notification.save();
    res.json({ success: true, message: 'Notification sent successfully', data: null });
}));

router.post('/send-email-superUser', asyncHandler(async (req, res) => {
    const { to, subject, body, isHtml } = req.body;
    console.log(req.body);

    if (!to || !subject || !body) {
        // return res.status(400).json({ success: false, message:  });
        console.log("To, subject, and body are required.");
        return;
    }

 const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.myEmail,  
    pass: process.env.myPassword,
  }
});

  // Mail options
const mailOptions = {
  from: process.env.myEmail,
  to:to,
  subject: subject,
  text: body,
  html: isHtml ? body : undefined ,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});


}));

router.get('/track-notification/:id', asyncHandler(async (req, res) => {
    const  notificationId  =req.params.id;

    const response = await client.viewNotification(notificationId);
    const androidStats = response.body.platform_delivery_stats;

    const result = {
        platform: 'Android',
        success_delivery: androidStats.android.successful,
        failed_delivery: androidStats.android.failed,
        errored_delivery: androidStats.android.errored,
        opened_notification: androidStats.android.converted
    };
    console.log('Notification details:', androidStats);
    res.json({ success: true, message: 'success', data: result });
}));


router.get('/all-notification', asyncHandler(async (req, res) => {
    try {
        const notifications = await Notification.find({}).sort({ _id: -1 });
        res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
    const notificationID = req.params.id;
    try {
        const notification = await Notification.findByIdAndDelete(notificationID);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }
        res.json({ success: true, message: "Notification deleted successfully.",data:null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


module.exports = router;
