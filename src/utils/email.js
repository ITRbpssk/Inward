const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,

    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});





transporter.verify((error, success) => {

    if (error) {

        console.error(
            "EMAIL CONFIGURATION ERROR:",
            error
        );

    } else {

        console.log(
            "EMAIL SERVER READY"
        );

    }

});


const sendOtpEmail = async (
    email,
    fullName,
    otp
) => {

    const mailOptions = {

        from: `"User Satisfaction Index" <${process.env.MAIL_USER}>`,

        to: email,

        subject: "Password Reset OTP - User Satisfaction Index",

        html: `
        <div style="
            font-family: Arial, sans-serif;
            background:#f5f7fb;
            padding:40px;
        ">

            <div style="
                max-width:600px;
                margin:auto;
                background:#ffffff;
                border-radius:12px;
                padding:35px;
                border:1px solid #e5e7eb;
            ">

                <h2 style="
                    color:#2563eb;
                    margin-bottom:5px;
                ">
                    User Satisfaction Index
                </h2>

                <p style="
                    color:#64748b;
                    margin-top:0;
                ">
                    Rajarambapu Patil Sahakari Sakhar Karkhana Ltd.
                </p>

                <hr style="
                    border:none;
                    border-top:1px solid #e5e7eb;
                    margin:25px 0;
                ">

                <h3>
                    Password Reset Request
                </h3>

                <p>
                    Hello <strong>${fullName || "User"}</strong>,
                </p>

                <p>
                    We received a request to reset your account password.
                    Use the OTP below to continue.
                </p>

                <div style="
                    text-align:center;
                    margin:30px 0;
                ">

                    <span style="
                        display:inline-block;
                        background:#eff6ff;
                        color:#2563eb;
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        padding:18px 30px;
                        border-radius:10px;
                    ">
                        ${otp}
                    </span>

                </div>

                <p style="
                    color:#64748b;
                    font-size:14px;
                ">
                    This OTP is valid for <strong>10 minutes</strong>.
                </p>

                <p style="
                    color:#64748b;
                    font-size:14px;
                ">
                    If you did not request a password reset,
                    please ignore this email.
                </p>

                <hr style="
                    border:none;
                    border-top:1px solid #e5e7eb;
                    margin:25px 0;
                ">

                <p style="
                    color:#94a3b8;
                    font-size:12px;
                ">
                    This is an automated email. Please do not reply.
                </p>

            </div>

        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};


module.exports = {
    sendOtpEmail
};