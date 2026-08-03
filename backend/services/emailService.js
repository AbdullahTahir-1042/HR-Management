const nodemailer = require('nodemailer');

/**
 * Initialize Nodemailer transporter client dynamically using SMTP configurations
 */
const getTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

    if (!host || !port || !user || !pass) {
        console.warn('[EmailService] Warning: One or more SMTP configurations (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS) are missing.');
        return null;
    }

    return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for port 465, false for other ports (like 587)
        auth: {
            user,
            pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

/**
 * Base method to dispatch emails via Nodemailer
 * @param {Object} params
 * @param {string|string[]} params.to - Target recipient email(s)
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - Rendered HTML body content
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!to) {
            return { success: false, error: 'Recipient email address (to) is required.' };
        }

        const transporter = getTransporter();
        if (!transporter) {
            return { success: false, error: 'Email service is unconfigured. SMTP credentials missing.' };
        }

        const fromAddress = process.env.EMAIL_FROM || 'HR Management System <noreply@company.com>';
        const targetTo = Array.isArray(to) ? to.join(', ') : to;

        const mailOptions = {
            from: fromAddress,
            to: targetTo,
            subject: subject || 'HR Management System Notification',
            html
        };

        // --- Structured Logging (Pre-dispatch) ---
        console.log(`[EmailService] 🔄 Attempting to dispatch email...`);
        console.log(`[EmailService] ✉️ Recipient: ${targetTo}`);
        console.log(`[EmailService] 📌 Event/Subject: ${mailOptions.subject}`);

        const info = await transporter.sendMail(mailOptions);
        
        // --- Structured Logging (Success) ---
        console.log(`[EmailService] ✅ Email successfully delivered. Message ID: ${info.messageId}`);
        return { success: true, data: { id: info.messageId } };
    } catch (err) {
        // --- Structured Logging (Failure) ---
        console.error('[EmailService] ❌ Failed to dispatch email to recipient.');
        
        // Log complete error safely (without exposing raw transporter credentials)
        const safeError = {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response,
            responseCode: err.responseCode,
            stack: err.stack
        };
        console.error('[EmailService Exception Details]:', safeError);
        
        return { success: false, error: err.message || 'Failed to deliver email' };
    }
};

module.exports = {
    sendEmail
};
