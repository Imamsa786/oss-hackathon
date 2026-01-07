// Check if user is logged in
let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
let authHeaders = {
    username: sessionStorage.getItem('adminUsername'),
    password: sessionStorage.getItem('adminPassword')
};

// Show appropriate screen on load
if (isLoggedIn) {
    showDashboard();
    loadDashboardData();
} else {
    showLogin();
}

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store credentials
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            sessionStorage.setItem('adminPassword', password);
            
            authHeaders = { username, password };
            
            showDashboard();
            loadDashboardData();
        } else {
            showMessage('Login Failed', data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error', 'Failed to connect to server', 'error');
    }
});

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
}

function logout() {
    sessionStorage.clear();
    authHeaders = {};
    isLoggedIn = false;
    showLogin();
    document.getElementById('loginForm').reset();
}

async function loadDashboardData() {
    try {
        // Load statistics
        await loadStats();
        
        // Load registrations
        await loadRegistrations();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showMessage('Error', 'Failed to load dashboard data', 'error');
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: authHeaders
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            document.getElementById('totalTeams').textContent = stats.totalTeams || 0;
            document.getElementById('totalParticipants').textContent = stats.totalParticipants || 0;
            document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue || 0}`;
            document.getElementById('pendingTeams').textContent = stats.pendingTeams || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRegistrations() {
    const tbody = document.getElementById('registrationsBody');
    
    try {
        const response = await fetch('/api/admin/registrations', {
            headers: authHeaders
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const registrations = data.data;
            
            if (registrations.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                            No registrations yet
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = registrations.map(reg => {
                const memberCount = reg.teamMembers ? reg.teamMembers.length : 0;
                const amount = reg.payment?.amount || 'Pending';
                const status = reg.status || 'pending';
                const date = new Date(reg.timestamp).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const statusClass = status === 'confirmed' ? 'status-confirmed' : 
                                  status === 'pending' ? 'status-pending' : 'status-rejected';
                
                return `
                    <tr>
                        <td><strong>${escapeHtml(reg.teamName)}</strong></td>
                        <td>${escapeHtml(reg.teamLeaderName)}</td>
                        <td>${escapeHtml(reg.teamLeaderEmail)}</td>
                        <td>${memberCount} members</td>
                        <td>₹${amount}</td>
                        <td><span class="status ${statusClass}">${status.toUpperCase()}</span></td>
                        <td>${date}</td>
                    </tr>
                `;
            }).join('');
        } else {
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--bright-red);">
                    Failed to load registrations. Please try again.
                </td>
            </tr>
        `;
    }
}

async function refreshData() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🔄 REFRESHING...';
    
    try {
        await loadDashboardData();
        showMessage('Success', 'Data refreshed successfully', 'success');
    } catch (error) {
        showMessage('Error', 'Failed to refresh data', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🔄 REFRESH DATA';
    }
}

async function exportCSV() {
    try {
        const response = await fetch('/api/admin/export', {
            headers: authHeaders
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `oss_hackathon_registrations_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showMessage('Success', 'CSV exported successfully', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        showMessage('Error', 'Failed to export CSV', 'error');
    }
}

function showMessage(title, message, type) {
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    if (type === 'success') {
        modalIcon.innerHTML = '<div style="font-size: 4rem; color: #4CAF50;">✓</div>';
    } else if (type === 'error') {
        modalIcon.innerHTML = '<div style="font-size: 4rem; color: var(--bright-red);">✗</div>';
    } else {
        modalIcon.innerHTML = '<div style="font-size: 4rem; color: var(--gold);">!</div>';
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh every 30 seconds when dashboard is visible
setInterval(() => {
    if (isLoggedIn && document.getElementById('dashboardScreen').style.display !== 'none') {
        loadStats();
    }
}, 30000);
