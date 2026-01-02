// Payment Page Logic - FIXED

// ✅ FIXED: Use window.location.origin
const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    // Load registration data from localStorage
    const teamName = localStorage.getItem('teamName');
    const teamSize = localStorage.getItem('teamSize');
    const amount = localStorage.getItem('amount');
    const registrationId = localStorage.getItem('registrationId');
    
    if (!registrationId || !teamName || !teamSize || !amount) {
        alert('No registration found. Please register first.');
        window.location.href = 'register.html';
        return;
    }
    
    // Display payment details
    document.getElementById('displayTeamName').textContent = teamName;
    document.getElementById('displayTeamSize').textContent = teamSize;
    document.getElementById('displayAmount').textContent = '₹' + amount;
});

// Preview uploaded image
document.getElementById('paymentProof')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            e.target.value = '';
            return;
        }
        
        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only PNG or JPG images');
            e.target.value = '';
            return;
        }
        
        console.log('File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    }
});

// Handle payment proof form submission
document.getElementById('paymentProofForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const registrationId = localStorage.getItem('registrationId');
    const transactionId = document.getElementById('transactionId').value.trim();
    const paymentProofFile = document.getElementById('paymentProof').files[0];
    
    if (!paymentProofFile) {
        alert('Please upload payment screenshot');
        return;
    }
    
    // Show processing modal
    document.getElementById('processingModal').classList.add('active');
    
    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('registrationId', registrationId);
        formData.append('transactionId', transactionId || 'NOT_PROVIDED');
        formData.append('proof', paymentProofFile);
        
        console.log('Submitting payment...');
        console.log('Registration ID:', registrationId);
        console.log('Transaction ID:', transactionId);
        console.log('File:', paymentProofFile.name);
        
        // Submit to backend
        const response = await fetch(`${API_URL}/api/payment/submit`, {
            method: 'POST',
            body: formData
            // Don't set Content-Type header - browser will set it automatically with boundary
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Result:', result);
        
        // Hide processing modal
        document.getElementById('processingModal').classList.remove('active');
        
        if (response.ok && result.success) {
            // Store success status
            localStorage.setItem('transactionId', result.data.transactionId);
            localStorage.setItem('paymentStatus', 'success');
            
            // Redirect to success page
            alert('Payment proof submitted successfully!');
            window.location.href = 'success.html';
        } else {
            alert('Payment submission failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Payment error:', error);
        document.getElementById('processingModal').classList.remove('active');
        alert('Failed to submit payment. Please check your connection and try again.');
    }
});