// Validation utilities

const validateEmail = (email) => {
    // Check if email ends with @klu.ac.in
    const emailRegex = /^[^\s@]+@klu\.ac\.in$/;
    return emailRegex.test(email);
};

const validateTeamSize = (members) => {
    // Maximum 4 members including leader
    return members.length > 0 && members.length <= 4;
};

const validateRegisterNumber = (regNo) => {
    // Basic validation - can be customized
    return regNo && regNo.trim().length > 0;
};

const validateDepartment = (dept) => {
    const validDepts = ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'ARC', 'EEE', 'BIOM'];
    return validDepts.includes(dept);
};

const validateYear = (year) => {
    const validYears = ['I', 'II', 'III', 'IV', 'V'];
    return validYears.includes(year);
};

const validateRegistrationData = (data) => {
    const errors = [];

    // Team name
    if (!data.teamName || data.teamName.trim().length === 0) {
        errors.push('Team name is required');
    }

    // Team leader name
    if (!data.teamLeaderName || data.teamLeaderName.trim().length === 0) {
        errors.push('Team leader name is required');
    }

    // Team leader email
    if (!validateEmail(data.teamLeaderEmail)) {
        errors.push('Team leader email must be a valid @klu.ac.in email');
    }

    // Team members
    if (!data.teamMembers || !Array.isArray(data.teamMembers)) {
        errors.push('Team members data is invalid');
    } else {
        // Validate team size
        if (!validateTeamSize(data.teamMembers)) {
            errors.push('Team must have 1 to 4 members');
        }

        // Validate each member
        data.teamMembers.forEach((member, index) => {
            if (!member.name || member.name.trim().length === 0) {
                errors.push(`Member ${index + 1}: Name is required`);
            }

            if (!validateRegisterNumber(member.registerNumber)) {
                errors.push(`Member ${index + 1}: Register number is required`);
            }

            if (!validateDepartment(member.department)) {
                errors.push(`Member ${index + 1}: Invalid department`);
            }

            if (!validateYear(member.year)) {
                errors.push(`Member ${index + 1}: Invalid year`);
            }

            if (!validateEmail(member.email)) {
                errors.push(`Member ${index + 1}: Email must be a valid @klu.ac.in email`);
            }
        });

        // Check for duplicate emails within team
        const emails = data.teamMembers.map(m => m.email);
        const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
        if (duplicateEmails.length > 0) {
            errors.push('Duplicate emails found within team members');
        }

        // Check for duplicate register numbers within team
        const regNos = data.teamMembers.map(m => m.registerNumber);
        const duplicateRegNos = regNos.filter((regNo, index) => regNos.indexOf(regNo) !== index);
        if (duplicateRegNos.length > 0) {
            errors.push('Duplicate register numbers found within team members');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateEmail,
    validateTeamSize,
    validateRegisterNumber,
    validateDepartment,
    validateYear,
    validateRegistrationData
};