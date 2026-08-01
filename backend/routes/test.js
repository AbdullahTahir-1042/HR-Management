const express = require("express");
const router = express.Router();

const { sendEmail } = require("../services/emailService");
const { getTestEmailTemplate } = require("../templates/testEmail");

// ======================================================
// TEST EMAIL ROUTE
// POST /api/test/send-email
// ======================================================

router.post("/send-email", async (req, res) => {
    console.log('✓ Test Route Hit');
    console.log("Request Body:", req.body);

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const template = getTestEmailTemplate();

        const result = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html
        });

        console.log("Resend Response:", result);

        return res.status(200).json({
            success: true,
            message: "Email sent successfully.",
            result
        });

    } catch (error) {

        console.error("❌ Email Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send email.",
            error: error.message
        });

    }
});

module.exports = router;