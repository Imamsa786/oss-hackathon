// Admin Dashboard Logic - FIXED

// ✅ FIXED: Use window.location.origin
const API_URL = window.location.origin;
let adminCredentials = null;

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            adminCredentials = { username, password };
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboardScreen').style.display = 'block';
            loadDashboardData();
        } else {
            showModal('Login Failed', 'Invalid username or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showModal('Error', 'Failed to connect to server', 'error');
    }
});

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load statistics
        const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
            headers: {
                'username': adminCredentials.username,
                'password': adminCredentials.password
            }
        });

        const statsResult = await statsResponse.json();

        if (statsResult.success) {
            document.getElementById('totalTeams').textContent = statsResult.data.totalTeams;
            document.getElementById('totalParticipants').textContent = statsResult.data.totalParticipants;
            document.getElementById('totalRevenue').textContent = `₹${statsResult.data.totalAmount.toLocaleString('en-IN')}`;
            document.getElementById('pendingTeams').textContent = statsResult.data.pendingTeams;
        }

        // Load registrations
        const registrationsResponse = await fetch(`${API_URL}/api/admin/registrations`, {
            headers: {
                'username': adminCredentials.username,
                'password': adminCredentials.password
            }
        });

        const registrationsResult = await registrationsResponse.json();

        if (registrationsResult.success) {
            displayRegistrations(registrationsResult.data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showModal('Error', 'Failed to load dashboard data', 'error');
    }
}

// Display registrations in table
function displayRegistrations(registrations) {
    const tbody = document.getElementById('registrationsBody');

    if (registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    No registrations found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = registrations.map(reg => {
        const statusColor = reg.status === 'completed' ? '#00ff00' : '#ff9900';
        const statusText = reg.status === 'completed' ? 'Paid' : 'Pending';
        const amount = reg.payment ? `₹${reg.payment.amount}` : '-';
        const date = new Date(reg.timestamp).toLocaleDateString('en-IN');

        return `
            <tr>
                <td>${reg.teamName}</td>
                <td>${reg.teamLeaderName}</td>
                <td>${reg.teamLeaderEmail}</td>
                <td>${reg.teamMembers.length}</td>
                <td>${amount}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');
}

// Refresh data
async function refreshData() {
    showModal('Refreshing', 'Loading latest data...', 'info');
    await loadDashboardData();
    closeModal();
}

// Export to CSV
async function exportCSV() {
    if (!adminCredentials) {
        showModal('Error', 'Not authenticated', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/export`, {
            headers: {
                'username': adminCredentials.username,
                'password': adminCredentials.password
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `oss_hackathon_registrations_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showModal('Success', 'CSV file downloaded successfully!', 'success');
        } else {
            showModal('Error', 'Failed to export data', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showModal('Error', 'Failed to export data', 'error');
    }
}

// Logout
function logout() {
    adminCredentials = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

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