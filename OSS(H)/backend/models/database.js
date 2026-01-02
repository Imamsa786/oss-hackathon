const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/registrations.json');

class Database {
    // Read all registrations
    static getAll() {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            return JSON.parse(data).registrations;
        } catch (error) {
            console.error('Error reading database:', error);
            return [];
        }
    }

    // Add new registration
    static add(registration) {
        try {
            const data = this.getAll();
            const newRegistration = {
                id: Date.now().toString(),
                ...registration,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            data.push(newRegistration);
            fs.writeFileSync(DB_PATH, JSON.stringify({ registrations: data }, null, 2));
            return newRegistration;
        } catch (error) {
            console.error('Error adding registration:', error);
            throw error;
        }
    }

    // Update registration status
    static updateStatus(id, status, paymentDetails = {}) {
        try {
            const data = this.getAll();
            const index = data.findIndex(r => r.id === id);
            if (index !== -1) {
                data[index].status = status;
                data[index].payment = paymentDetails;
                fs.writeFileSync(DB_PATH, JSON.stringify({ registrations: data }, null, 2));
                return data[index];
            }
            return null;
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    }

    // Check if email or register number exists
    static checkDuplicate(email, registerNumber) {
        try {
            const data = this.getAll();

            // Check in team leaders
            const leaderExists = data.some(r => r.teamLeaderEmail === email);

            // Check in team members
            const memberExists = data.some(r =>
                r.teamMembers.some(m =>
                    m.email === email || m.registerNumber === registerNumber
                )
            );

            return leaderExists || memberExists;
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return false;
        }
    }

    // Get statistics
    static getStats() {
        try {
            const data = this.getAll();
            const completedRegistrations = data.filter(r => r.status === 'completed');

            const totalTeams = completedRegistrations.length;
            const totalParticipants = completedRegistrations.reduce((sum, r) =>
                sum + r.teamMembers.length, 0
            );
            const totalAmount = totalParticipants * 250;

            return {
                totalTeams,
                totalParticipants,
                totalAmount,
                pendingTeams: data.filter(r => r.status === 'pending').length
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { totalTeams: 0, totalParticipants: 0, totalAmount: 0, pendingTeams: 0 };
        }
    }

    // Get registration by ID
    static getById(id) {
        try {
            const data = this.getAll();
            return data.find(r => r.id === id);
        } catch (error) {
            console.error('Error getting registration:', error);
            return null;
        }
    }
}

module.exports = Database;