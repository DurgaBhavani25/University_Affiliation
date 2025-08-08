const token = localStorage.getItem("token");
if (!token) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get("id");

async function fetchApplicationById() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(
      `https://acadamiaaffiliation.onrender.com/appraisal/application/${appId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const result = await response.json();

    if (result.success) {
      const app = result.data;
      // Populate fields
      document.getElementById("collegeName").innerText =
        app.submittedBy?.collegeDetails?.collegeName || "N/A";
      document.getElementById("email").innerText =
        app.submittedBy?.email || "N/A";
      document.getElementById("courseTitle").innerText =
        app.courseTitle || "N/A";
      document.getElementById("affiliationType").innerText =
        app.affiliationType || "N/A";
      document.getElementById("status").innerText = app.status || "N/A";
      document.getElementById("finalDecisionDate").innerText =
        app.finalDecisionDate
          ? new Date(app.finalDecisionDate).toLocaleDateString()
          : "N/A";
      document.getElementById("infrastructureDetails").innerText =
        app.infrastructureDetails || "N/A";
      document.getElementById("facultyName").innerText =
        app.facultyInfo?.name || "N/A";
      document.getElementById("facultyQualification").innerText =
        app.facultyInfo?.qualification || "N/A";
      document.getElementById("courseFee").innerText = app.courseFee || "N/A";
      const documentsContainer = document.getElementById("Documents_uploaded");

      if (app.supportingDocuments?.length > 0) {
        const links = app.supportingDocuments.map((doc) => {
          return `<a href="https://acadamiaaffiliation.onrender.com${doc.fileUrl}" target="_blank">${doc.fileName}</a>`;
        });
        documentsContainer.innerHTML = links.join(", "); // or use '<br>' to show each on new line
      } else {
        documentsContainer.innerText = "No documents uploaded";
      }

      // Set status badge class
      const statusBadge = document.getElementById("status");
      statusBadge.className = "status-badge";
      if (app.status === "pending") {
        statusBadge.classList.add("status-pending");
      } else if (app.status === "approved") {
        statusBadge.classList.add("status-approved");
      } else if (app.status === "rejected") {
        statusBadge.classList.add("status-rejected");
      } else {
        statusBadge.classList.add("status-under-review");
      }

      // Set appraisal status badge
      const appraisalStatusBadge = document.getElementById("appraisalStatus");
      appraisalStatusBadge.innerText = app.appraisalStatus || "not_verified";
      appraisalStatusBadge.className = "status-badge";
      if (app.appraisalStatus === "verified") {
        appraisalStatusBadge.classList.add("status-approved");
      } else if (app.appraisalStatus === "rejected") {
        appraisalStatusBadge.classList.add("status-rejected");
      } else {
        appraisalStatusBadge.classList.add("status-pending");
      }

      // Set officer name if available
      if (result.user) {
        document.getElementById("officerNameHeader").innerText =
          result.user.name || "Appraisal Officer";
      }
    } else {
      alert(
        "Failed to fetch application: " + (result.message || "Unknown error")
      );
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Error fetching data. Check console for details.");
  }
}

// Handle file upload display
document
  .getElementById("supportingDocs")
  .addEventListener("change", function (e) {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    Array.from(e.target.files).forEach((file) => {
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${(file.size / 1024 / 1024).toFixed(
              2
            )} MB</span>
            <i class="fas fa-times file-remove" onclick="removeFile(this)"></i>
          `;
      fileList.appendChild(fileItem);
    });
  });

function removeFile(element) {
  const fileInput = document.getElementById("supportingDocs");
  const files = Array.from(fileInput.files);
  const fileName =
    element.parentElement.querySelector(".file-name").textContent;

  // Remove from display
  element.parentElement.remove();

  // Remove from file input (requires creating a new DataTransfer object)
  const dataTransfer = new DataTransfer();
  files.forEach((file) => {
    if (file.name !== fileName) {
      dataTransfer.items.add(file);
    }
  });

  fileInput.files = dataTransfer.files;
}

// Handle form submission
document
  .getElementById("verificationForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const formData = new FormData();

    // Add form data
    formData.append("visitDate", document.getElementById("visitDate").value);
    formData.append(
      "recommendation",
      document.getElementById("recommendation").value
    );
    formData.append(
      "verificationNotes",
      document.getElementById("verificationNotes").value
    );
    formData.append(
      "priority",
      document.querySelector('input[name="priority"]:checked').value
    );

    // Add files
    const files = document.getElementById("supportingDocs").files;
    for (let i = 0; i < files.length; i++) {
      formData.append("supportingDocs", files[i]);
    }

    try {
      const response = await fetch(
        `https://acadamiaaffiliation.onrender.com/appraisal/submit-verification/${appId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Verification submitted successfully!");
        window.location.reload();
      } else {
        alert(
          "Failed to submit verification: " +
            (result.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error submitting verification. Check console for details.");
    }
  });

// Initialize on page load
document.addEventListener("DOMContentLoaded", fetchApplicationById);
