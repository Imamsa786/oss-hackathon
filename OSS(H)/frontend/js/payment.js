const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('displayTeamName').textContent =
        localStorage.getItem('teamName');

    document.getElementById('displayTeamSize').textContent =
        localStorage.getItem('teamSize');

    document.getElementById('displayAmount').textContent =
        '₹' + localStorage.getItem('amount');
});

document.getElementById('paymentProofForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('registrationId', localStorage.getItem('registrationId'));
    formData.append('transactionId', document.getElementById('transactionId').value);
    formData.append('proof', document.getElementById('paymentProof').files[0]);

    try {
        const res = await fetch(`${API_URL}/api/payment/submit`, {
            method: 'POST',
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            window.location.href = 'success.html';
        } else {
            alert(result.message || 'Payment submission failed');
        }
    } catch (err) {
        alert('Server error. Try again.');
    }
});
