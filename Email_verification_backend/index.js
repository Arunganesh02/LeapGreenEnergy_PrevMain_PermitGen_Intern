const express = require("express");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Nodemailer setup (using Gmail as an example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pavi.g721@gmail.com',
    pass: 'uvku baec jqko esji' // Use the app-specific password here
  }
});

// Route to send verification email
app.post("/sendVerificationEmail", async (req, res) => {
  const { email } = req.body;
  
  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(verificationCode)
  try {
    // Store the verification code in Firestore
    const db = admin.firestore();
    const docRef = db.collection("verifications").doc(email);
    await docRef.set({
      email,
      verificationCode,
      isVerified: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send the verification email
    const mailOptions = {
      from: 'Pavithran',
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ success: true, verificationCode, message: "Verification email sent!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Route to verify the code
app.post("/verifyCode", async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Retrieve the stored verification code from Firestore
    const db = admin.firestore();
    const docRef = db.collection("verifications").doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(400).send({ success: false, message: "No record found for this email." });
    }

    const data = doc.data();

    // Check if the provided code matches the stored code
    if (data.verificationCode === verificationCode) {
      // Update the user's verification status
      await docRef.update({ isVerified: true });
      return res.status(200).send({ success: true, message: "Email verified successfully!" });
    } else {
      return res.status(400).send({ success: false, message: "Invalid verification code." });
    }
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
