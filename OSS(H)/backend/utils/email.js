const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send receipt email
const sendReceiptEmail = async (teamLeaderEmail, teamLeaderName, teamName, pdfPath) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `OSS Hackathon <${process.env.EMAIL_USER}>`,
            to: teamLeaderEmail,
            subject: '✓ OSS Hackathon Registration Confirmed - Alice in Borderland',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #000;
              color: #fff;
            }
            .header {
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #8B0000, #000);
              border-radius: 10px;
            }
            .header h1 {
              color: #fff;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #ff4444;
              margin: 5px 0;
              font-size: 18px;
            }
            .symbols {
              font-size: 24px;
              color: #8B0000;
              margin: 10px 0;
            }
            .content {
              padding: 30px 20px;
              background-color: #1a1a1a;
              margin-top: 20px;
              border-radius: 10px;
              border: 2px solid #8B0000;
            }
            .greeting {
              font-size: 18px;
              color: #fff;
              margin-bottom: 20px;
            }
            .info-box {
              background-color: #2a2a2a;
              padding: 15px;
              border-left: 4px solid #8B0000;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #888;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #8B0000;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="symbols">♠ ♥ ♦ ♣</div>
              <h1>OSS HACKATHON</h1>
              <p>Alice in Borderland</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${teamLeaderName},
              </div>
              
              <p>Congratulations! Your team <strong>"${teamName}"</strong> has been successfully registered for the OSS Hackathon.</p>
              
              <div class="info-box">
                <strong>📋 Registration Details:</strong><br>
                Team Name: ${teamName}<br>
                Team Leader: ${teamLeaderName}<br>
                Status: <span style="color: #00ff00;">Confirmed ✓</span>
              </div>
              
              <p>Your payment receipt is attached to this email. Please keep it for your records.</p>
              
              <div class="info-box">
                <strong>📅 Important Information:</strong><br>
                • Bring a valid college ID on the event day<br>
                • Report at the venue 30 minutes before the start time<br>
                • Check your email for further updates<br>
                • Join our WhatsApp group (link will be shared soon)
              </div>
              
              <p>Get ready to enter the Borderland! We're excited to see what your team creates.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>OSS - Open Source Society</strong><br>
                KL University
              </p>
            </div>
            
            <div class="footer">
              <div class="symbols">♠ ♥ ♦ ♣</div>
              <p>For queries, contact: oss@klu.ac.in</p>
              <p>&copy; 2025 OSS - Open Source Society. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: 'Receipt.pdf',
                    path: pdfPath
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendReceiptEmail };