const nodemailer = require("nodemailer");

/**
 * Initialize Nodemailer transporter
 */
const getTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS
        ? process.env.EMAIL_PASS.replace(/\s+/g, "")
        : "";

    if (!host || !port || !user || !pass) {
        console.error("[EmailService] Missing SMTP environment variables.");
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
        host: host,
        port: port,
        secure: port === 465,
        localAddress: '0.0.0.0',
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
            rejectUnauthorized: false,
        },
    });
};

/**
 * Send Email
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!to) {
            return {
                success: false,
                error: "Recipient email is required.",
            };
        }

        const transporter = getTransporter();

        if (!transporter) {
            return {
                success: false,
                error: "SMTP transporter could not be created.",
            };
        }

        console.log("[EmailService] Verifying SMTP connection...");

        await transporter.verify();

        console.log("[EmailService] SMTP connection verified successfully.");

        const mailOptions = {
            from:
                process.env.EMAIL_FROM ||
                `HR Management System <${process.env.EMAIL_USER}>`,
            to,
            subject: subject || "HR Management Notification",
            html,
        };

        console.log("[EmailService] Sending email...");
        console.log("[EmailService] To:", to);
        console.log("[EmailService] Subject:", subject);

        const info = await transporter.sendMail(mailOptions);

        console.log("[EmailService] Email sent successfully.");
        console.log("[EmailService] Message ID:", info.messageId);

        return {
            success: true,
            data: info,
        };
    } catch (err) {
        console.error("========== EMAIL ERROR ==========");
        console.error("Message:", err.message);
        console.error("Code:", err.code);
        console.error("Command:", err.command);
        console.error("Response:", err.response);
        console.error("Response Code:", err.responseCode);
        console.error("Stack:", err.stack);
        console.error("=================================");

        return {
            success: false,
            error: err.message,
        };
    }
};

module.exports = {
    sendEmail,
};  