
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must log in first.");
        window.location.href = "login.html";
      }
      function logout() {
        localStorage.removeItem("token");
        window.location.href = "index.html";
      }
      let allAssignedApplications = []; // Global array to hold fetched applications

      async function loadAppraisalStats() {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch("https://acadamiaaffiliation.onrender.com/appraisal/stats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await res.json();

          if (result.success) {
            const { total, pending, approved, rejected } = result.data;

            document.querySelector(
              ".stat-card:nth-child(1) .stat-value"
            ).textContent = total;
            document.querySelector(
              ".stat-card:nth-child(2) .stat-value"
            ).textContent = pending;
            document.querySelector(
              ".stat-card:nth-child(3) .stat-value"
            ).textContent = approved;
            document.querySelector(
              ".stat-card:nth-child(4) .stat-value"
            ).textContent = rejected;
          } else {
            alert("Failed to load appraisal stats.");
          }
        } catch (err) {
          console.error("Error loading appraisal stats:", err);
        }
      }
      document.addEventListener("DOMContentLoaded", loadAppraisalStats);

      document.querySelector(".btn-view").addEventListener("click", () => {
        loadAppraisalStats(); // on Refresh button click
      });

      // Simple section switching logic
      function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll(".section").forEach((section) => {
          section.classList.remove("active");
        });

        // Show selected section
        document.getElementById(sectionId).classList.add("active");

        // Update active nav item
        document.querySelectorAll(".nav__items").forEach((item) => {
          item.classList.remove("active");
        });

        // Find the clicked nav item and make it active
        document.querySelectorAll(".nav__items").forEach((item) => {
          if (item.getAttribute("onclick") === `showSection('${sectionId}')`) {
            item.classList.add("active");
          }
        });
      }
      let currentPage = 1; // default page
      const itemsPerPage = 4;
      document.addEventListener("DOMContentLoaded", function () {
        fetchAssignedApplications(); // defaults to page 1

        const prevBtn = document.getElementById("prevPageBtn");
        const nextBtn = document.getElementById("nextPageBtn");

        prevBtn?.addEventListener("click", () => {
          fetchAssignedApplications(currentPage - 1);
        });

        nextBtn?.addEventListener("click", () => {
          fetchAssignedApplications(currentPage + 1);
        });
      });

      async function fetchAssignedApplications(page = 1) {
        currentPage = page;
        const token = localStorage.getItem("token"); // Get JWT token
        const tbody = document.getElementById("assignedAppsBody");
        tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

        try {
          const response = await fetch(
            `https://acadamiaaffiliation.onrender.com/appraisal/assigned-applications?page=${page}&limit=4`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result = await response.json();
          allAssignedApplications = result.data;
          tbody.innerHTML = ""; // Clear loading message

          if (result.success) {
            const applications = result.data;
            const totalPages = result.totalPages || 1; // ✅ Extract totalPages from server
            currentPage = result.page || page; // ✅ Ensure currentPage is in sync

            if (applications.length === 0) {
              tbody.innerHTML =
                '<tr><td colspan="7">No assigned applications found.</td></tr>';
            } else {
              applications.forEach((app, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
              <td>${app._id.slice(-4)}</td>
              <td>${app.submittedBy?.collegeDetails?.collegeName || "N/A"}</td>
              <td>${app.courseTitle}</td>
              <td>${app.affiliationType}</td>
              <td>${app.status}</td>
              <td>${
                app.dueDate
                  ? new Date(app.dueDate).toISOString().split("T")[0] // formats as "YYYY-MM-DD"
                  : "N/A"
              }</td>

              <td><button class="btn btn-view btn-sm" onclick="viewApplication('${
                app._id
              }')">View</button></td>
            `;
                tbody.appendChild(tr);
              });
            }
            updatePaginationControls(currentPage, totalPages);
          } else {
            tbody.innerHTML =
              '<tr><td colspan="7">Failed to load data</td></tr>';
          }
        } catch (err) {
          console.error("Error fetching assigned applications:", err);
          tbody.innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
        }
      }
      document
        .getElementById("searchInput")
        .addEventListener("input", filterApplications);

      function filterApplications() {
        const searchTerm = document
          .getElementById("searchInput")
          .value.toLowerCase();
        const tbody = document.getElementById("assignedAppsBody");
        const filtered = allAssignedApplications.filter((app) => {
          const collegeName =
            app.submittedBy?.collegeDetails?.collegeName?.toLowerCase() || "";

          const courseTitle = app.courseTitle?.toLowerCase() || "";
          const affiliationType = app.affiliationType?.toLowerCase() || "";
          const status = app.status?.toLowerCase() || "";
          const last4Id = app._id.slice(-4);

          return (
            collegeName.includes(searchTerm) ||
            courseTitle.includes(searchTerm) ||
            affiliationType.includes(searchTerm) ||
            status.includes(searchTerm) ||
            last4Id.includes(searchTerm)
          );
        });

        // Update table
        tbody.innerHTML = "";

        if (filtered.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="7">No applications match your search.</td></tr>';
        } else {
          filtered.forEach((app) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${app._id.slice(-4)}</td>
        <td>${app.submittedBy?.collegeDetails?.collegeName || "N/A"}</td>
        <td>${app.courseTitle}</td>
        <td>${app.affiliationType}</td>
        <td>${app.status}</td>
        <td>${
          app.finalDecisionDate
            ? new Date(app.finalDecisionDate).toLocaleDateString()
            : "N/A"
        }</td>
        <td>
          <button class="btn btn-view btn-sm" onclick="viewApplication('${
            app._id
          }')">View</button>
        </td>`;
            tbody.appendChild(tr);
          });
        }
      }

      function updatePaginationControls(currentPage, totalPages) {
        const prevBtn = document.getElementById("prevPageBtn");
        const nextBtn = document.getElementById("nextPageBtn");

        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        prevBtn.onclick = () => fetchAssignedApplications(currentPage - 1);
        nextBtn.onclick = () => fetchAssignedApplications(currentPage + 1);
      }

      // Redirect or open modal - example:
      function viewApplication(applicationId) {
        window.location.href = `review.html?id=${applicationId}`;
      }

      // Load Profile Data on Page Load
      window.addEventListener("DOMContentLoaded", async () => {
        try {
          const res = await fetch("https://acadamiaaffiliation.onrender.com/appraisal/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (data.success) {
            const user = data.data;
            document.getElementById("profileName").textContent =
              user.appraisalDetails.fullName;
            document.getElementById("designation").textContent =
              user.appraisalDetails.designation;
            document.getElementById("designation1").value =
              user.appraisalDetails.designation;
            document.querySelector(".email").textContent = user.email;
            document.getElementById("fullName").value =
              user.appraisalDetails.fullName;
            document.getElementById("email").value = user.email;
            document.getElementById("phone").value =
              user.appraisalDetails.contactNumber;
            document.getElementById("department").value =
              user.appraisalDetails.department;
            document.getElementById("bio").value = user.appraisalDetails.bio;
            document.getElementById("experience").value =
              user.appraisalDetails.experience;
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      });

      // Handle Form Submission (Update Profile)
      document
        .getElementById("profileForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();

          const updatedData = {
            fullName: document.getElementById("fullName").value,
            department: document.getElementById("department").value,
            contactNumber: document.getElementById("phone").value,
            password: document.getElementById("newPassword").value || undefined,
            experience: document.getElementById("experience").value,
            bio: document.getElementById("bio").value,
            designation: document.getElementById("designation1").value,
          };
          try {
            const res = await fetch("https://acadamiaaffiliation.onrender.com/appraisal/profile", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(updatedData),
            });

            const data = await res.json();
            if (data.success) {
              alert("Profile updated successfully");
            } else {
              alert("Update failed: " + data.message);
            }
          } catch (err) {
            alert("Error updating profile");
          }
        });
    
