const token = localStorage.getItem("token");

// Check authentication on page load
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must log in first.");
    window.location.href = "login.html";
    return;
  }
  fetch("https://acadamiaaffiliation.onrender.com/api/profile", {
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

document
  .getElementById("collegeForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent page reload

    const collegeName = document.getElementById("collegeName1").value.trim();
    const address = document.getElementById("address").value.trim();
    const contactPerson = document.getElementById("contactPerson").value.trim();
    const contactNumber = document.getElementById("contactNumber").value.trim();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("User not authenticated");
      return;
    }

    try {
      const response = await fetch("https://acadamiaaffiliation.onrender.com/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collegeName,
          address,
          contactPerson,
          contactNumber,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text(); // Read raw response to help debugging
        console.error("Non-JSON response:", text);
        throw new Error("Expected JSON response but got something else.");
      }

      const messageEl = document.getElementById("updateMessage");

      if (response.ok) {
        initDashboard();
        messageEl.style.color = "green";
        messageEl.textContent = data.message || "Update successful!";
        document.getElementById("collegeName1").textContent = collegeName;
        document.getElementById("collegeName").textContent = collegeName;
        document.getElementById("address").textContent = address;
        document.getElementById("contactPerson").textContent = contactPerson;
        document.getElementById("contactNumber").textContent = contactNumber;
      } else {
        messageEl.style.color = "red";
        messageEl.textContent = data.message || "Update failed!";
      }
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("updateMessage").textContent =
        "Something went wrong.";
    }
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
  document
    .getElementById("affiliationForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const appId = document.getElementById("collegeId").value;
      const isEdit = !!appId;

      const formData = new FormData();

      // Append basic fields
      formData.append(
        "courseTitle",
        document.getElementById("courseName").value
      );
      formData.append(
        "duration",
        document.getElementById("courseDuration").value
      );
      formData.append(
        "intakeCapacity",
        document.getElementById("intake").value
      );
      formData.append("courseFee", document.getElementById("courseFee").value);
      formData.append(
        "infrastructureDetails",
        document.getElementById("infrastructure").value
      );
      formData.append(
        "affiliationType",
        document.getElementById("affiliationType").value
      );

      // Append facultyInfo as stringified JSON
      const faculty = {
        name: document.getElementById("facultyName").value,
        qualification: document.getElementById("facultyQualification").value,
      };
      formData.append(
        "facultyInfo",
        JSON.stringify({
          name: document.getElementById("facultyName").value || "",
          qualification:
            document.getElementById("facultyQualification").value || "",
        })
      );

      // Append files
      const fileInput = document.getElementById("documentUpload");
      if (!fileInput) {
        console.error("❌ File input not found.");
        return;
      }
      const files = fileInput.files;
      for (let i = 0; i < files.length; i++) {
        formData.append("supportingDocuments", files[i]); // 'supportingDocuments' is the name field
      }

      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `https://acadamiaaffiliation.onrender.com/api/affiliations/${appId}`
        : `https://acadamiaaffiliation.onrender.com/api/affiliations`;

      fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // ⛔️ Don't set Content-Type manually when using FormData
        },
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to submit/resubmit application");
          return res.json();
        })
        .then(() => {
          alert(
            isEdit
              ? "Application resubmitted successfully!"
              : "Application submitted!"
          );
          document.getElementById("affiliationForm").reset();
          // Optionally refresh dashboard
          loadApplications();
        })
        .catch((err) => {
          console.error("Submission error:", err);
          alert("An error occurred while submitting.");
        });
    });
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
      "https://acadamiaaffiliation.onrender.com/api/affiliations/my-requests",
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

  fetch(`https://acadamiaaffiliation.onrender.com/api/affiliations/${appId}`, {
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
                <p><strong>Course Fee:</strong> ${application.courseFee}</p>
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
                              `<a href="https://acadamiaaffiliation.onrender.com${doc.fileUrl}" target="_blank">
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
      }
      if (application.adminDecision === "resubmit") {
        actionsHtml = `
    <button class="modal-btn modal-btn-secondary" onclick="closeModal()">Close</button>
    <button class="modal-btn modal-btn-warning" onclick="populateResubmissionForm('${application._id}')">
      <i class="fas fa-edit"></i> Edit & Resubmit
    </button>
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
function populateResubmissionForm(appId) {
  closeModal(); // Hide modal

  fetch(`https://acadamiaaffiliation.onrender.com/api/affiliations/${appId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  })
    .then((res) => res.json())
    .then((app) => {
      document.getElementById("courseName").value = app.courseTitle;
      document.getElementById("courseDuration").value = app.duration;
      document.getElementById("intake").value = app.intakeCapacity;
      document.getElementById("facultyName").value =
        app.facultyInfo?.name || "";
      document.getElementById("facultyQualification").value =
        app.facultyInfo?.qualification || "";
      document.getElementById("infrastructure").value =
        app.infrastructureDetails;
      document.getElementById("courseFee").value = app.courseFee;
      document.getElementById("affiliationType").value = app.affiliationType;
      document.getElementById("collegeId").value = app._id; // store ID for PUT
      document.getElementById("form").scrollIntoView({ behavior: "smooth" }); // scroll to form
    })
    .catch((err) => {
      console.error("Error populating form:", err);
      alert("Failed to load application for resubmission.");
    });
}

function closeModal() {
  document.getElementById("viewModal").style.display = "none";
}

function deleteApplication(appId, fromModal = false) {
  if (!confirm("Are you sure you want to delete this application?")) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`https://acadamiaaffiliation.onrender.com/api/affiliations/${appId}`, {
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
