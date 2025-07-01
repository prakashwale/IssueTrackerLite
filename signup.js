document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const msg = document.getElementById('signupMsg');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        msg.style.color = 'red';
        msg.textContent = 'Username already exists.';
        return;
    }
    if (password !== confirm) {
        msg.style.color = 'red';
        msg.textContent = 'Passwords do not match.';
        return;
    }
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', username);
    window.location.href = 'index.html';
}); 