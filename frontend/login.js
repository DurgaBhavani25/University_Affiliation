
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role');
  console.log("User Role:", role);

  // Optional: You can use it to customize your login page
  document.getElementById("roleTitle").textContent = `Login as ${role}`;


  const form = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, role }) // Send the role
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Save token before redirect
      localStorage.setItem("token", data.token);
      console.log("Token saved:", localStorage.getItem("token"));

      // ✅ Redirect after a small delay to allow storage
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "dashboard_admin.html";
        } else if (data.user.role === "college") {
          window.location.href = "dashboard_college.html";
        } else if (data.user.role === "appraisal") {
          window.location.href = "dashboard_appraisal.html";
        }
      }, 100); // Short delay for reliability
    } else {
      document.getElementById("message").textContent = data.message || "Login failed";
    }
  } catch (err) {
    console.error("Error logging in:", err);
    document.getElementById("message").textContent = "An error occurred";
  }
});


  // Toggle Password Visibility
  function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.querySelector(".toggle-password");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleBtn.textContent = "Hide";
    } else {
      passwordInput.type = "password";
      toggleBtn.textContent = "Show";
    }
  }
