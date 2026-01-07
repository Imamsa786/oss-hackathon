const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        // Path to store data persistently
        this.dataDir = path.join(__dirname, '..', 'data');
        this.dataFile = path.join(this.dataDir, 'registrations.json');
        
        // Ensure data directory exists
        this.ensureDataDirectory();
        
        // Load existing data or initialize empty array
        this.registrations = this.loadData();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return [];
    }

    saveData() {
        try {
            fs.writeFileSync(
                this.dataFile, 
                JSON.stringify(this.registrations, null, 2),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    add(registration) {
        try {
            const newRegistration = {
                ...registration,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                status: registration.status || 'pending'
            };
            
            this.registrations.push(newRegistration);
            this.saveData();
            
            return {
                success: true,
                data: newRegistration
            };
        } catch (error) {
            console.error('Error adding registration:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getAll() {
        return this.registrations;
    }

    getById(id) {
        return this.registrations.find(reg => reg.id === id);
    }

    getByEmail(email) {
        return this.registrations.find(
            reg => reg.teamLeaderEmail.toLowerCase() === email.toLowerCase()
        );
    }

    updateStatus(id, status) {
        try {
            const index = this.registrations.findIndex(reg => reg.id === id);
            if (index !== -1) {
                this.registrations[index].status = status;
                this.registrations[index].updatedAt = new Date().toISOString();
                this.saveData();
                return {
                    success: true,
                    data: this.registrations[index]
                };
            }
            return {
                success: false,
                error: 'Registration not found'
            };
        } catch (error) {
            console.error('Error updating status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    delete(id) {
        try {
            const index = this.registrations.findIndex(reg => reg.id === id);
            if (index !== -1) {
                const deleted = this.registrations.splice(index, 1);
                this.saveData();
                return {
                    success: true,
                    data: deleted[0]
                };
            }
            return {
                success: false,
                error: 'Registration not found'
            };
        } catch (error) {
            console.error('Error deleting registration:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getStats() {
        const totalTeams = this.registrations.length;
        
        const totalParticipants = this.registrations.reduce((sum, reg) => {
            return sum + (reg.teamMembers ? reg.teamMembers.length : 0);
        }, 0);
        
        const totalRevenue = this.registrations.reduce((sum, reg) => {
            if (reg.payment && reg.payment.amount) {
                return sum + parseFloat(reg.payment.amount);
            }
            return sum;
        }, 0);
        
        const pendingTeams = this.registrations.filter(
            reg => reg.status === 'pending'
        ).length;
        
        const confirmedTeams = this.registrations.filter(
            reg => reg.status === 'confirmed'
        ).length;

        return {
            totalTeams,
            totalParticipants,
            totalRevenue,
            pendingTeams,
            confirmedTeams
        };
    }

    // Backup function - creates a backup of current data
    createBackup() {
        try {
            const backupFile = path.join(
                this.dataDir, 
                `backup_${Date.now()}.json`
            );
            fs.writeFileSync(
                backupFile,
                JSON.stringify(this.registrations, null, 2),
                'utf8'
            );
            return {
                success: true,
                file: backupFile
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
module.exports = new Database();
