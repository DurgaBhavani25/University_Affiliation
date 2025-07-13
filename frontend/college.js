const token = localStorage.getItem("token");

// Check authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must log in first.");
    window.location.href = "login.html";
    return;
  }
  fetch("http://localhost:5000/api/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    })
    .then((data) => {
      document.getElementById("collegeName").textContent =
        data.collegeName || "Not available";
      document.getElementById("collegeName1").value = data.collegeName || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("contactPerson").value = data.contactPerson || "";
      document.getElementById("contactNumber").value = data.contactNumber || "";
    })
    .catch((error) => {
      console.error("Error loading college name:", error);
    });
  // Initialize the page
  initDashboard();
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

function initDashboard() {
  // Load college name if available
  const collegeName = localStorage.getItem("collegeName");
  if (collegeName) {
    document.getElementById("collegeName").textContent = collegeName;
  }

  // Set up form submission
  document
    .getElementById("affiliationForm")
    .addEventListener("submit", handleFormSubmit);

  // Set up file upload display
  document
    .getElementById("documentUpload")
    .addEventListener("change", function () {
      const files = Array.from(this.files);
      const fileNamesSpan = document.getElementById("fileNames");
      const documentList = document.getElementById("documentList");

      if (files.length === 0) {
        fileNamesSpan.textContent = "No files selected";
        documentList.innerHTML = "";
        return;
      }

      fileNamesSpan.textContent = `${files.length} file(s) selected`;
      documentList.innerHTML = files
        .map(
          (f) =>
            `<div class="document-item">
              <span>${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>`
        )
        .join("");
    });

  // Load applications table
  loadApplications();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    return;
  }

  const form = e.target;
  const submitBtn = document.getElementById("submitBtn");
  const originalBtnText = submitBtn.innerHTML;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

  try {
    const formData = new FormData();
    formData.append("courseTitle", form.courseName.value);
    formData.append("duration", form.courseDuration.value);
    formData.append("intakeCapacity", form.intake.value);
    formData.append("infrastructureDetails", form.infrastructure.value);
    const facultyInfo = {
      name: form.facultyName.value,
      qualification: form.facultyQualification.value,
    };
    formData.append("facultyInfo", JSON.stringify(facultyInfo));

    formData.append("courseFee", form.courseFee.value);
    formData.append("affiliationType", form.affiliationType.value);

    // Add files
    const files = document.getElementById("documentUpload").files;
    for (let i = 0; i < files.length; i++) {
      formData.append("supportingDocuments", files[i]);
    }

    const response = await fetch("http://localhost:5000/api/affiliations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert("✅ Application Submitted Successfully!");
      form.reset();
      document.getElementById("fileNames").textContent = "No files selected";
      document.getElementById("documentList").innerHTML = "";
      loadApplications(); // Refresh the applications table
    } else {
      throw new Error(result.message || "Submission failed");
    }
  } catch (err) {
    console.error("Submission error:", err);
    alert(`❌ Error: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

async function loadApplications() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const tableBody = document.getElementById("applicationsTableBody");
  const statusFilter = document.getElementById("statusFilter");
  const sortOrder = document.getElementById("sortOrder");

  // Show loading state
  tableBody.innerHTML = `<tr><td colspan="6"><div style="text-align: center; padding: 20px;">Loading applications...</div></td></tr>`;

  try {
    const response = await fetch(
      "http://localhost:5000/api/affiliations/my-requests",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch applications");
    }

    const applications = await response.json();
    renderApplicationsTable(applications);

    // Set up filter/sort event listeners
    statusFilter.addEventListener("change", () =>
      renderApplicationsTable(applications)
    );
    sortOrder.addEventListener("change", () =>
      renderApplicationsTable(applications)
    );
  } catch (err) {
    console.error("Error loading applications:", err);
    tableBody.innerHTML = `<tr><td colspan="6"><div style="text-align: center; padding: 20px; color: #dc3545;">Error loading applications. Please try again.</div></td></tr>`;
  }
}

function renderApplicationsTable(applications) {
  const tableBody = document.getElementById("applicationsTableBody");
  const statusFilter = document.getElementById("statusFilter").value;
  const sortOrder = document.getElementById("sortOrder").value;

  // Filter applications
  let filteredApps = [...applications];
  if (statusFilter !== "all") {
    filteredApps = filteredApps.filter((app) => app.status === statusFilter);
  }

  // Sort applications
  filteredApps.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Render table
  if (filteredApps.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6"><div style="text-align: center; padding: 20px;">No applications found matching your criteria.</div></td></tr>`;
    return;
  }

  tableBody.innerHTML = filteredApps
    .map(
      (app, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${app.courseTitle}</td>
            <td>${app.affiliationType}</td>
            <td>${new Date(app.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge ${getStatusClass(
              app.status
            )}">${formatStatus(app.status)}</span></td>
            <td>
              <button class="action-btn view-btn" onclick="viewApplication('${
                app._id
              }')">View</button>
              ${
                app.status === "pending"
                  ? `<button class="action-btn delete-btn" onclick="deleteApplication('${app._id}')">Delete</button>`
                  : ""
              }
            </td>
          </tr>
        `
    )
    .join("");
}

function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "status-pending";
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    case "under_review":
      return "status-under-review";
    default:
      return "";
  }
}

function formatStatus(status) {
  const statusMap = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    under_review: "Under Review",
    assigned: "Assigned",
  };
  return statusMap[status] || status;
}

// View application details
function viewApplication(appId) {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`http://localhost:5000/api/affiliations/${appId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    })
    .then((application) => {
      // Format the application details for display
      const detailsHtml = `
              <div class="status-section">
                <h4>Application Status: <span class="status-badge ${getStatusClass(
                  application.status
                )}">
                  ${formatStatus(application.status)}
                </span></h4>
                ${
                  application.appraisalStatus
                    ? `<p><strong>Appraisal Status:</strong> ${application.appraisalStatus}</p>`
                    : ""
                }
                ${
                  application.remarks
                    ? `<p><strong>Remarks:</strong> ${application.remarks}</p>`
                    : ""
                }
              </div>

              <div class="status-section">
                <h4>Course Details</h4>
                <p><strong>Course Title:</strong> ${application.courseTitle}</p>
                <p><strong>Duration:</strong> ${application.duration}</p>
                <p><strong>Intake Capacity:</strong> ${
                  application.intakeCapacity
                }</p>
                <p><strong>Course Fee:</strong> ₹${application.courseFee}</p>
                <p><strong>Affiliation Type:</strong> ${
                  application.affiliationType
                }</p>
              </div>

              <div class="status-section">
  <h4>Faculty Information</h4>
  ${
    application.facultyInfo
      ? `
        <p><strong>Name:</strong> ${application.facultyInfo.name || "N/A"}</p>
        <p><strong>Qualification:</strong> ${
          application.facultyInfo.qualification || "N/A"
        }</p>
      `
      : "<p>No faculty information available</p>"
  }
</div>


              <div class="status-section">
                <h4>Infrastructure Details</h4>
                <p>${application.infrastructureDetails}</p>
              </div>

              <div class="status-section">
                <h4>Documents</h4>
                <div class="document-list-modal">
                  ${
                    application.supportingDocuments &&
                    application.supportingDocuments.length > 0
                      ? application.supportingDocuments

                          .map(
                            (doc) =>
                              `<a href="http://localhost:5000${doc.fileUrl}" target="_blank">
      <i class="fas fa-file-alt"></i> ${doc.fileName}
    </a>`
                          )

                          .join("")
                      : "<p>No documents uploaded</p>"
                  }
                </div>
              </div>

              <div class="status-section">
                <p><strong>Submitted On:</strong> ${new Date(
                  application.createdAt
                ).toLocaleString()}</p>
                ${
                  application.updatedAt
                    ? `<p><strong>Last Updated:</strong> ${new Date(
                        application.updatedAt
                      ).toLocaleString()}</p>`
                    : ""
                }
              </div>
            `;

      // Set the modal content
      document.getElementById("modalDetails").innerHTML = detailsHtml;

      // Set up action buttons based on status
      let actionsHtml = "";
      if (application.status === "pending") {
        actionsHtml = `
                <button class="modal-btn modal-btn-secondary" onclick="closeModal()">Close</button>
                <button class="modal-btn modal-btn-primary" onclick="deleteApplication('${application._id}', true)">Delete Application</button>
              `;
      } else {
        actionsHtml = `
                <button class="modal-btn modal-btn-primary" onclick="closeModal()">Close</button>
              `;
      }

      document.getElementById("modalActions").innerHTML = actionsHtml;

      // Show the modal
      document.getElementById("viewModal").style.display = "flex";
    })
    .catch((err) => {
      console.error("Error fetching application:", err);
      alert("Failed to load application details. Please try again.");
    });
}

function closeModal() {
  document.getElementById("viewModal").style.display = "none";
}

function deleteApplication(appId, fromModal = false) {
  if (!confirm("Are you sure you want to delete this application?")) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`http://localhost:5000/api/affiliations/${appId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    })
    .then(() => {
      alert("Application deleted successfully");
      if (fromModal) closeModal();
      loadApplications(); // Refresh the table
    })
    .catch((err) => {
      console.error("Delete error:", err);
      alert("Failed to delete application. Please try again.");
    });
}

// Close modal when clicking outside content
window.addEventListener("click", function (event) {
  const modal = document.getElementById("viewModal");
  if (event.target === modal) {
    closeModal();
  }
});
