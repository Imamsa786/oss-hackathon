const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateReceipt = (registration, paymentDetails) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `receipt_${registration.id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../data/receipts', fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header with card symbols
            doc.fontSize(24).fillColor('#8B0000').text('♠ ♥ ♦ ♣', { align: 'center' });
            doc.moveDown(0.5);

            // Title
            doc.fontSize(28).fillColor('#000000').text('OSS HACKATHON', { align: 'center' });
            doc.fontSize(18).fillColor('#8B0000').text('Alice in Borderland', { align: 'center' });
            doc.moveDown(0.5);

            // Receipt heading
            doc.fontSize(20).fillColor('#000000').text('PAYMENT RECEIPT', { align: 'center' });
            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#8B0000');
            doc.moveDown(1);

            // Team Details
            doc.fontSize(14).fillColor('#000000').text('TEAM DETAILS', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12);
            doc.text(`Team Name: ${registration.teamName}`);
            doc.text(`Team Leader: ${registration.teamLeaderName}`);
            doc.text(`Email: ${registration.teamLeaderEmail}`);
            doc.moveDown(1);

            // Team Members
            doc.fontSize(14).text('TEAM MEMBERS', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11);
            registration.teamMembers.forEach((member, index) => {
                doc.text(`${index + 1}. ${member.name}`);
                doc.text(`   Reg No: ${member.registerNumber} | ${member.department} | Year ${member.year}`, {
                    indent: 10
                });
                doc.text(`   Email: ${member.email}`, { indent: 10 });
                doc.moveDown(0.3);
            });

            doc.moveDown(1);

            // Payment Details
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#8B0000');
            doc.moveDown(0.5);

            doc.fontSize(14).fillColor('#000000').text('PAYMENT DETAILS', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(12);
            doc.text(`Number of Participants: ${registration.teamMembers.length}`);
            doc.text(`Rate per Participant: ₹250`);
            doc.text(`Transaction ID: ${paymentDetails.transactionId}`);
            doc.text(`Payment Date: ${new Date().toLocaleDateString('en-IN')}`);
            doc.moveDown(0.5);

            // Total amount in a box
            doc.rect(50, doc.y, 500, 40).fillAndStroke('#8B0000', '#8B0000');
            doc.fontSize(16).fillColor('#FFFFFF')
                .text(`TOTAL AMOUNT PAID: ₹${paymentDetails.amount}`, 50, doc.y + 10, {
                    width: 500,
                    align: 'center'
                });

            doc.moveDown(3);

            // Footer
            doc.fontSize(10).fillColor('#666666').text(
                'Thank you for registering! We look forward to seeing you at the hackathon.',
                { align: 'center' }
            );
            doc.moveDown(0.5);
            doc.text('For queries, contact: oss@klu.ac.in', { align: 'center' });

            // Card symbols at bottom
            doc.fontSize(16).fillColor('#8B0000').text('♠ ♥ ♦ ♣', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve({ fileName, filePath });
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReceipt };