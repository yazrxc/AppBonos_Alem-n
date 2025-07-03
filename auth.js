document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:8000'; // Your backend URL

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButton = document.getElementById('logoutButton'); // Will be in index.html
    const userDisplay = document.getElementById('userDisplay'); // Will be in index.html

    // --- LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.textContent = ''; // Clear previous messages

            try {
                const response = await fetch(`${API_BASE_URL}/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('trabajador_id', data.trabajador_id);
                    localStorage.setItem('username', data.username);
                    window.location.href = 'index.html'; // Redirect to main app page
                } else {
                    loginMessage.textContent = data.detail || 'Error al iniciar sesión.';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'Error de conexión. Inténtalo de nuevo.';
            }
        });
    }

    // --- REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('regNombre').value;
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const fecha_de_nacimiento = document.getElementById('regFechaNacimiento').value || null; // Send null if empty
            const genero = document.getElementById('regGenero').value || null; // Send null if empty

            const registerMessage = document.getElementById('registerMessage');
            registerMessage.textContent = ''; // Clear previous messages

            const payload = {
                nombre,
                username,
                password,
                fecha_de_nacimiento,
                genero
                // Add other optional fields here if you included them in the form
            };
             // Remove null fields from payload as backend expects them to be absent or valid
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === "") {
                    delete payload[key];
                }
            });


            try {
                const response = await fetch(`${API_BASE_URL}/register/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    registerMessage.classList.remove('text-danger');
                    registerMessage.classList.add('text-success');
                    registerMessage.textContent = '¡Registro exitoso! Serás redirigido al login.';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    registerMessage.classList.add('text-danger');
                    registerMessage.classList.remove('text-success');
                    registerMessage.textContent = data.detail || 'Error en el registro.';
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerMessage.classList.add('text-danger');
                registerMessage.classList.remove('text-success');
                registerMessage.textContent = 'Error de conexión. Inténtalo de nuevo.';
            }
        });
    }

    // --- LOGOUT LOGIC ---
    function handleLogout() {
        localStorage.removeItem('trabajador_id');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // --- AUTH CHECK & USER DISPLAY (for protected pages like index.html) ---
    function checkAuthAndDisplayUser() {
        const trabajadorId = localStorage.getItem('trabajador_id');
        const username = localStorage.getItem('username');

        // If on a page that is not login or register, and no user ID, redirect to login
        const currentPage = window.location.pathname.split('/').pop();
        if (!['login.html', 'register.html'].includes(currentPage) && !trabajadorId) {
            window.location.href = 'login.html';
            return; // Stop further execution
        }

        if (userDisplay && username) {
            userDisplay.textContent = username; // Display username
        } else if (userDisplay) {
            userDisplay.textContent = "Usuario"; // Default if not found
        }
    }

    // Run auth check on page load for all pages (it will handle redirection if needed)
    checkAuthAndDisplayUser();
});