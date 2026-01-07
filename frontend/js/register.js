// Registration Form Logic

const API_URL = window.location.origin;
let memberCount = 0;
const MAX_MEMBERS = 5;

// Add member form
document.getElementById('addMemberBtn').addEventListener('click', addMemberForm);

function addMemberForm() {
    if (memberCount >= MAX_MEMBERS) {
        showModal('Maximum Members Reached', 'You can only add up to 5 team members.', 'error');
        return;
    }

    memberCount++;
    const memberId = `member${memberCount}`;

    const memberDiv = document.createElement('div');
    memberDiv.className = 'card';
    memberDiv.id = memberId;
    memberDiv.style.marginBottom = '20px';
    memberDiv.style.position = 'relative';

    memberDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="color: var(--bright-red);">Member ${memberCount}</h4>
            <button type="button" onclick="removeMember('${memberId}')" 
                    style="background: none; border: none; color: var(--bright-red); font-size: 1.5rem; cursor: pointer;">
                ×
            </button>
        </div>
        
        <div class="form-group">
            <label>Full Name *</label>
            <input type="text" name="memberName${memberCount}" required placeholder="Enter full name">
        </div>
        
        <div class="form-group">
            <label>Register Number *</label>
            <input type="text" name="memberRegNo${memberCount}" required placeholder="Enter register number">
        </div>
        
        <div class="form-group">
            <label>Department *</label>
            <select name="memberDept${memberCount}" required>
               <option value="">Select Department</option>
                <option value="CSE">CSE - Computer Science Engineering</option>
                <option value="ECE">ECE - Electronics & Communication</option>
                <option value="IT">IT - Information Technology</option>
                <option value="MECH">MECH - Mechanical Engineering</option>
                <option value="EEE">EEE - Electrical & Electronics</option>
                <option value="others"> OTHERs </option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Year *</label>
            <select name="memberYear${memberCount}" required>
                <option value="">Select Year</option>
                <option value="I">I - First Year</option>
                <option value="II">II - Second Year</option>
                <option value="III">III - Third Year</option>
                <option value="IV">IV - Fourth Year</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Email (KLU) *</label>
            <input type="email" name="memberEmail${memberCount}" required 
                   placeholder="example@klu.ac.in" pattern="[a-zA-Z0-9._%+-]+@klu\\.ac\\.in">
            <small style="color: #888;">Must be a valid @klu.ac.in email</small>
        </div>
    `;

    document.getElementById('membersContainer').appendChild(memberDiv);

    // Disable add button if max reached
    if (memberCount >= MAX_MEMBERS) {
        document.getElementById('addMemberBtn').disabled = true;
        document.getElementById('addMemberBtn').style.opacity = '0.5';
        document.getElementById('addMemberBtn').style.cursor = 'not-allowed';
    }
}

function removeMember(memberId) {
    document.getElementById(memberId).remove();
    memberCount--;

    // Re-enable add button
    if (memberCount < MAX_MEMBERS) {
        document.getElementById('addMemberBtn').disabled = false;
        document.getElementById('addMemberBtn').style.opacity = '1';
        document.getElementById('addMemberBtn').style.cursor = 'pointer';
    }

    // Renumber remaining members
    renumberMembers();
}

function renumberMembers() {
    const memberDivs = document.querySelectorAll('#membersContainer .card');
    memberDivs.forEach((div, index) => {
        const newNumber = index + 1;
        div.querySelector('h4').textContent = `Member ${newNumber}`;
        div.id = `member${newNumber}`;
    });
    memberCount = memberDivs.length;
}

// Form submission
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (memberCount === 0) {
        showModal('No Team Members', 'Please add at least one team member.', 'error');
        return;
    }

    // Collect form data
    const teamName = document.getElementById('teamName').value.trim();
    const teamLeaderName = document.getElementById('teamLeaderName').value.trim();
    const teamLeaderEmail = document.getElementById('teamLeaderEmail').value.trim().toLowerCase();

    // Validate email domain
    if (!teamLeaderEmail.endsWith('@klu.ac.in')) {
        showModal('Invalid Email', 'Team leader email must be from @klu.ac.in domain.', 'error');
        return;
    }

    // Collect team members
    const teamMembers = [];
    for (let i = 1; i <= memberCount; i++) {
        const name = document.querySelector(`input[name="memberName${i}"]`)?.value.trim();
        const registerNumber = document.querySelector(`input[name="memberRegNo${i}"]`)?.value.trim();
        const department = document.querySelector(`select[name="memberDept${i}"]`)?.value;
        const year = document.querySelector(`select[name="memberYear${i}"]`)?.value;
        const email = document.querySelector(`input[name="memberEmail${i}"]`)?.value.trim().toLowerCase();

        if (!name || !registerNumber || !department || !year || !email) {
            showModal('Incomplete Information', `Please fill all fields for Member ${i}.`, 'error');
            return;
        }

        if (!email.endsWith('@klu.ac.in')) {
            showModal('Invalid Email', `Member ${i}'s email must be from @klu.ac.in domain.`, 'error');
            return;
        }

        teamMembers.push({
            name,
            registerNumber,
            department,
            year,
            email
        });
    }

    // Check for duplicate emails within team
    const emails = teamMembers.map(m => m.email);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
        showModal('Duplicate Emails', 'Each team member must have a unique email address.', 'error');
        return;
    }

    // Check for duplicate register numbers within team
    const regNos = teamMembers.map(m => m.registerNumber);
    const uniqueRegNos = new Set(regNos);
    if (regNos.length !== uniqueRegNos.size) {
        showModal('Duplicate Register Numbers', 'Each team member must have a unique register number.', 'error');
        return;
    }

    // Prepare registration data
    const registrationData = {
        teamName,
        teamLeaderName,
        teamLeaderEmail,
        teamMembers
    };

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div>';

    try {
        // Submit to backend
        const response = await fetch(`${API_URL}/api/registration/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Store registration ID and redirect to payment
            localStorage.setItem('registrationId', result.data.registrationId);
            localStorage.setItem('teamName', result.data.teamName);
            localStorage.setItem('teamSize', result.data.teamSize);
            localStorage.setItem('amount', result.data.amount);

            window.location.href = 'payment.html';
        } else {
            if (response.status === 409) {
                showModal('User Already Exists', result.message || 'One or more team members are already registered.', 'error');
            } else {
                showModal('Registration Failed', result.message || 'An error occurred during registration.', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Error:', error);
        showModal('Connection Error', 'Failed to connect to the server. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Modal functions
function showModal(title, message, type = 'info') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;

    const iconDiv = document.getElementById('modalIcon');
    if (type === 'error') {
        iconDiv.innerHTML = '<div style="font-size: 4rem; color: #ff0000;">⚠</div>';
    } else if (type === 'success') {
        iconDiv.innerHTML = '<div class="success-icon">✓</div>';
    } else {
        iconDiv.innerHTML = '<div style="font-size: 4rem; color: var(--bright-red);">ℹ</div>';
    }

    document.getElementById('messageModal').classList.add('active');
}

function closeModal() {
    document.getElementById('messageModal').classList.remove('active');
}

// Initialize with one member form
window.addEventListener('load', () => {
    addMemberForm();

});
