const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uniqid");

// for stripe payment gateway
const stripe = require('stripe')(process.env.STRIPE_SKRT_KET_TST);



router.post('/stripe', asyncHandler(async (req, res) => {
  try {
    console.log('stripe');
    const { email, name, address, amount, currency, description } = req.body;

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      address: address,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer.id,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PBLK_KET_TST,
    });

  } catch (error) {
    console.log(error);
    return res.json({ error: true, message: error.message, data: null });
  }
}));


router.post('/razorpay', asyncHandler(async (req, res) => {
  try {
    console.log('razorpay')
    const razorpayKey  = process.env.RAZORPAY_KEY_TEST
    res.json({  key: razorpayKey });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: true, message: error.message, data: null });
  }
}));


router.get("/phonePay", async function (req, res, next) {
  // Initiate a payment

  // Transaction amount
  const amount = +req.query.amount;

  let userId = req.query.userId ;

  if (!userId) {
    return res.status(400).json({ error: true, message: "userId is required" });
  }
  let phoneNo = req.query.phoneNo;
  // Generate a unique merchant transaction ID for each transaction
  let merchantTransactionId = uniqid();


  let normalPayLoad = {
    merchantId: process.env.MERCHANT_ID, // PHONEPEY MERCHANT_ID
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // converting to paise
    redirectUrl: `${process.env.APP_BE_URL}/payment/validate/${merchantTransactionId}`,//phonePe will redirect the user to this url once payment is completed.
    redirectMode: "REDIRECT",
    mobileNumber: `${phoneNo}`, // phone number of the user
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // make base64 encoded payload
  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64EncodedPayload = bufferObj.toString("base64");

  // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
  let string = base64EncodedPayload + "/pg/v1/pay" + process.env.SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + process.env.SALT_INDEX;

  axios
    .post(
      `${process.env.PHONE_PE_HOST_URL}/pg/v1/pay`,
      {
        request: base64EncodedPayload,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    )
    .then(function (response) {
      console.log("response->", JSON.stringify(response.data));
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    })
    .catch(function (error) {
      res.send(error);
    });
});




module.exports = router;