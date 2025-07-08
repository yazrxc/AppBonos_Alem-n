document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutButton = document.getElementById('logoutButton'); // En index.html
    const userDisplay = document.getElementById('userDisplay');   // En index.html

    // --- LOGIN LOGIC (Sin Backend) ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.textContent = ''; // Limpiar mensajes previos

            // Credenciales fijas (sin backend)
            const hardcodedUsername = 'usuario';
            const hardcodedPassword = 'usuario';

            if (username === hardcodedUsername && password === hardcodedPassword) {
                // Si las credenciales son correctas, simula el login exitoso
                console.log('Login exitoso');
                // Guardamos datos en localStorage para que otras partes de la app funcionen
                localStorage.setItem('trabajador_id', '1'); // Un ID de ejemplo
                localStorage.setItem('username', username);
                window.location.href = 'index.html'; // Redirigir a la página principal
            } else {
                // Si las credenciales son incorrectas
                console.log('Credenciales incorrectas');
                loginMessage.textContent = 'Nombre de usuario o contraseña incorrectos.';
            }
        });
    }

    // --- REGISTRATION LOGIC (DESHABILITADO) ---
    if (registerForm) {
       console.log("El formulario de registro existe pero su lógica está deshabilitada (no se usa backend).");
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

    // --- AUTH CHECK & USER DISPLAY (CORREGIDO) ---
    function checkAuthAndDisplayUser() {
        const trabajadorId = localStorage.getItem('trabajador_id');
        const username = localStorage.getItem('username');

        // Obtener el nombre del archivo actual (ej. 'index.html', 'login.html', o '' si es la raíz)
        const currentPage = window.location.pathname.split('/').pop();

        // Lógica de redirección:
        // 1. Comprobar si el usuario NO está logueado (!trabajadorId)
        // 2. Y si la página actual NO es ni 'login.html' ni 'register.html'.
        // CORRECCIÓN: Se eliminó '' de la lista de permitidos para proteger la página raíz (index.html).
        const allowedPages = ['login.html', 'register.html'];
        
        if (!trabajadorId && !allowedPages.includes(currentPage)) {
            // Si intenta acceder a una página protegida (como index.html) sin login, redirigir.
            // Solo redirigimos si no estamos ya en login.html (para evitar bucles infinitos si currentPage falla)
            if (currentPage !== 'login.html') {
                 window.location.href = 'login.html';
            }
            return; // Detener ejecución
        }

        // Si está logueado, mostrar el nombre (si el elemento existe en la página)
        if (userDisplay && username) {
            userDisplay.textContent = username;
        } else if (userDisplay) {
            userDisplay.textContent = "Usuario";
        }
    }

    // Ejecutar la comprobación de autenticación en todas las páginas
    checkAuthAndDisplayUser();
});