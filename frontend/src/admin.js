const token = localStorage.getItem("token");
if (!token) {
  alert("You must log in first.");
  window.location.href = "login.html";
}
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
let appraisalOfficers = [];
async function assignAppraisal(appId) {
  const select = document.getElementById(`assign-${appId}`);
  const assignedTo = select.value;

  if (!assignedTo) {
    alert("Please select an officer");
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5000/api/affiliations/assign/${appId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ assignedTo }),
      }
    );

    const result = await res.json();

    if (res.ok) {
      alert("Assigned successfully!");
      await loadApplications(); // Refresh list
    } else {
      console.error(result);
      alert("Failed to assign: " + result.message);
    }
  } catch (error) {
    console.error("Error assigning:", error);
    alert("Something went wrong during assignment.");
  }
}

let allRequests = []; // Store all data globally

// Fetch Data on Page Load
document.addEventListener("DOMContentLoaded", () => {
  fetchAffiliationRequests();
  loadApplications();
  fetchAffiliatedColleges();
  fetchAppraisals();
});
async function fetchAppraisals() {
  try {
    const res = await fetch("http://localhost:5000/admin/appraisals");
    const result = await res.json();

    if (result.success) {
      populateAppraisalTable(result.data);
    } else {
      console.error("Failed to load appraisal officers");
    }
  } catch (error) {
    console.error("Error fetching appraisals:", error);
  }
}

function populateAppraisalTable(appraisals) {
  const tbody = document.querySelector("#appraisalTable tbody");
  tbody.innerHTML = ""; // clear old data

  appraisals.forEach((appraisal, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${appraisal.appraisalDetails?.fullName || "N/A"}</td>
      <td>${appraisal.appraisalDetails?.designation || "N/A"}</td>
      <td>${appraisal.appraisalDetails?.department || "N/A"}</td>
      <td>${appraisal.appraisalDetails?.contactNumber || "N/A"}</td>
      <td>${appraisal.appraisalDetails?.region || "N/A"}</td>
      <td>
  <button class="btn btn-custom btn-sm" onclick="viewAppraisal('${
    appraisal._id
  }')">View</button>
  <button class="btn btn-custom2 btn-sm" onclick="deleteAppraisal('${
    appraisal._id
  }')">Delete</button>
</td>

    `;

    tbody.appendChild(row);
  });
}
async function viewAppraisal(id) {
  try {
    const response = await fetch(
      `http://localhost:5000/admin/appraisals/${id}`
    );
    const result = await response.json();

    if (result.success) {
      const a = result.data.appraisalDetails;

      document.getElementById("detailsModalLabel").innerText =
        "Appraisal Details";
      document.getElementById("detailsModalBody").innerHTML = `
        <p><strong>Full Name:</strong> ${a.fullName}</p>
        <p><strong>Designation:</strong> ${a.designation}</p>
        <p><strong>Department:</strong> ${a.department}</p>
        <p><strong>Contact Number:</strong> ${a.contactNumber}</p>
        <p><strong>Region:</strong> ${a.region}</p>
        <p><strong>Experience:</strong> ${a.experience} years</p>
        <p><strong>Bio:</strong> ${a.bio || "N/A"}</p>
      `;

      new bootstrap.Modal(document.getElementById("detailsModal")).show();
    } else {
      alert("Appraisal officer not found.");
    }
  } catch (error) {
    console.error("Error fetching appraisal details:", error);
    alert("Error viewing appraisal details.");
  }
}
async function deleteAppraisal(id) {
  if (!confirm("Are you sure you want to delete this appraisal officer?"))
    return;

  try {
    const response = await fetch(
      `http://localhost:5000/admin/appraisals/${id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (result.success) {
      alert("Appraisal officer deleted successfully.");
      fetchAppraisals(); // Refresh the table
    } else {
      alert("Failed to delete appraisal officer.");
    }
  } catch (error) {
    console.error("Error deleting appraisal officer:", error);
    alert("Error deleting appraisal officer.");
  }
}

async function fetchAffiliatedColleges() {
  try {
    const response = await fetch(
      "http://localhost:5000/admin/affiliated-colleges"
    );
    const result = await response.json();
    if (result.success) {
      populateCollegeTable(result.data);
    } else {
      console.error("Failed to load colleges");
    }
  } catch (error) {
    console.error("Error fetching colleges:", error);
  }
}
function populateCollegeTable(colleges) {
  const tbody = document.querySelector("#collegesTable tbody");
  tbody.innerHTML = ""; // clear previous rows

  colleges.forEach((college, index) => {
    const row = document.createElement("tr");

    const id = index + 1;
    const name = college.collegeDetails?.collegeName || "N/A";
    const location = college.collegeDetails?.address || "N/A";
    const affiliationSince = new Date(
      college.createdAt || Date.now()
    ).toLocaleDateString();
    // Replace if you have course data
    const status = "Active"; // Replace with dynamic status if needed

    row.innerHTML = `
        <td>${id}</td>
        <td>${name}</td>
        <td>${location}</td>
        <td>${affiliationSince}</td>
      
        <td>${status}</td>
        <td>
  <button class="btn btn-custom btn-sm" onclick="viewCollege('${college._id}')">View</button>
</td>

      `;

    tbody.appendChild(row);
  });
}
async function viewCollege(id) {
  try {
    const response = await fetch(
      `http://localhost:5000/admin/affiliated-colleges/${id}`
    );
    const result = await response.json();

    if (result.success) {
      const c = result.data.collegeDetails;

      document.getElementById("detailsModalLabel").innerText =
        "College Details";
      document.getElementById("detailsModalBody").innerHTML = `
        <p><strong>College Name:</strong> ${c.collegeName}</p>
        <p><strong>Address:</strong> ${c.address}</p>
        <p><strong>Contact Person:</strong> ${c.contactPerson}</p>
        <p><strong>Contact Number:</strong> ${c.contactNumber}</p>
      `;

      new bootstrap.Modal(document.getElementById("detailsModal")).show();
    } else {
      alert("College not found");
    }
  } catch (error) {
    console.error("Error fetching college details:", error);
    alert("Something went wrong while fetching college details.");
  }
}

let currentAppId = null;
let allRequests2 = [];
async function fetchAffiliationRequests() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must log in first.");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch("http://localhost:5000/api/affiliations/all", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch");

    allRequests = data.requests;
    allRequests2 = allRequests.filter(
      (req) => req.appraisalStatus == "verified"
    );
    window.currentRequests = allRequests2;
    populateDashboardCounts(allRequests);
    populateApplicationsTable(allRequests2);
  } catch (error) {
    console.error("Error fetching affiliation requests:", error.message);
  }
}

function populateDashboardCounts(requests) {
  const total = requests.length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const cards = document.querySelectorAll(".card p");
  cards[0].textContent = total;
  cards[1].textContent = pending;
  cards[2].textContent = approved;
  cards[3].textContent = rejected;
}
let allApplications = [];
async function loadApplications() {
  try {
    const res = await fetch("http://localhost:5000/api/affiliations/all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    allApplications = data.requests;
    Applications = allApplications.filter((app) => app.status === "pending");

    if (!Array.isArray(allApplications)) {
      console.error("Expected array but got:", allApplications);
      return;
    }

    await loadAppraisalOfficers();

    const tbody = document.querySelector("#allApplications tbody");
    tbody.innerHTML = "";

    // Group applications by collegeName
    const grouped = {};
    Applications.forEach((app) => {
      const collegeName =
        app.submittedBy?.collegeDetails?.collegeName || "Unknown College";
      if (!grouped[collegeName]) grouped[collegeName] = [];
      grouped[collegeName].push(app);
    });

    // Render each college group
    Object.entries(grouped).forEach(([collegeName, apps], idx) => {
      // Add college group header row
      // Extract one app to get the collegeId (assuming all apps in group are from the same college)
      const collegeId = apps[0].submittedBy.collegeDetails._id;

      const groupRow = document.createElement("tr");
      groupRow.innerHTML = `
  <td colspan="8" class="group-header" onclick="toggleGroup('group-${idx}')" style="cursor:pointer;">
    ▶ ${collegeName}
    <select id="college-assign-${idx}" style="margin-left:20px;">
      <option value="">Select Appraisal Officer</option>
      ${appraisalOfficers
        .map((a) => `<option value="${a._id}">${a.email}</option>`)
        .join("")}
    </select>
    <input type="date" id="due-date-${idx}" style="margin-left:10px;" />
    <button onclick="assignByCollege('${
      apps[0]._id
    }', 'college-assign-${idx}', 'due-date-${idx}')">Assign</button>
  </td>
`;

      tbody.appendChild(groupRow);

      apps.forEach((app) => {
        const row = document.createElement("tr");
        row.classList.add(`group-${idx}`); // for toggling

        const assignedTo = app.assignedTo?.email || "Not Assigned";

        const options = appraisalOfficers
          .map((a) => `<option value="${a._id}">${a.email}</option>`)
          .join("");

        row.innerHTML = `
          <td>${app._id.slice(-6).toUpperCase()}</td>

          <td>${app.courseTitle}</td>
          <td>${app.affiliationType}</td>
          <td>${new Date(app.createdAt).toLocaleDateString()}</td>
          <td>${app.status}</td>
          <td>${assignedTo}</td>
          
        `;
        tbody.appendChild(row);
      });
    });
  } catch (error) {
    console.error("Error loading applications:", error);
  }
}
async function assignByCollege(appId, selectId, dueDateId) {
  const selected = document.getElementById(selectId);
  const dueDateInput = document.getElementById(dueDateId);

  const assignedTo = selected?.value;
  const dueDate = dueDateInput?.value;

  if (!assignedTo || !dueDate) {
    alert("Please select an officer and a due date.");
    return;
  }

  const application = allApplications.find((a) => a._id === appId.trim());

  if (!application) {
    alert("Application not found");
    console.error(
      "App ID:",
      appId,
      "All apps:",
      allApplications.map((a) => a._id)
    );
    return;
  }

  const collegeName = application.submittedBy?.collegeDetails?.collegeName;

  const res = await fetch(
    "http://localhost:5000/api/affiliations/assign-by-college",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        collegeName,
        assignedTo,
        dueDate, // ✅ send due date to backend
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    alert("Failed to assign: " + error.message);
  } else {
    alert("Successfully assigned.");
    loadApplications();
  }
}

function toggleGroup(groupClass) {
  const rows = document.querySelectorAll(`.${groupClass}`);
  rows.forEach((row) => {
    row.style.display = row.style.display === "none" ? "table-row" : "none";
  });
}

async function loadAppraisalOfficers() {
  try {
    const res = await fetch("http://localhost:5000/api/users?role=appraisal", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    console.log("Appraisal Officers:", data); // Optional for debugging

    if (!Array.isArray(data)) {
      console.error("Expected an array of users, got:", data);
      return;
    }

    appraisalOfficers = data; // ✅ Assign correctly
  } catch (error) {
    console.error("Failed to load appraisers:", error);
  }
}

function populateApplicationsTable(requests) {
  const tbody = document.querySelector("#recentApplications tbody");
  tbody.innerHTML = "";

  if (requests.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No data to display</td></tr>";
    return;
  }

  requests.forEach((req) => {
    const row = document.createElement("tr");

    const statusClass =
      {
        approved: "status-approved",
        resubmit: "status-resubmit",
        rejected: "status-rejected",
      }[req.status?.toLowerCase()] || "";

    row.innerHTML = `
      <td>${req._id.slice(-6).toUpperCase()}</td>
      <td>${req.submittedBy?.collegeDetails?.collegeName || "N/A"}</td>
      <td>${req.courseTitle || "N/A"}</td>
      <td><span class="status-badge ${statusClass}">${
      req.status || "N/A"
    }</span></td>
      <td>${new Date(req.createdAt).toISOString().split("T")[0]}</td>
      <td>
<button  class="btn btn-custom btn-sm" onclick="showViewModal('${
      req._id
    }')">View</button>

</td>

    `;
    tbody.appendChild(row);
  });
}

function showViewModal(appId) {
  currentAppId = appId;
  const app = allApplications.find((a) => a._id === appId);
  if (!app) {
    alert("Application not found!");
    return;
  }

  document.getElementById("viewCollege").textContent =
    app.submittedBy?.collegeDetails?.collegeName || "N/A";
  document.getElementById("viewCourse").textContent = app.courseTitle || "N/A";
  document.getElementById("viewStatus").textContent = app.status || "N/A";
  document.getElementById("viewVisitDate").textContent = app.visitDate
    ? new Date(app.visitDate).toISOString().split("T")[0]
    : "N/A";
  document.getElementById("viewRecommendation").textContent =
    app.recommendation || "N/A";
  document.getElementById("viewVerificationNotes").textContent =
    app.verificationNotes || "N/A";

  // Documents
  const docsContainer = document.getElementById("viewAppraisalDocs");
  docsContainer.innerHTML = "";
  if (app.appraisalDocuments && app.appraisalDocuments.length > 0) {
    app.appraisalDocuments.forEach((doc) => {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.textContent = doc.fileName;
      link.target = "_blank";
      link.style.display = "block";
      docsContainer.appendChild(link);
    });
  } else {
    docsContainer.textContent = "No documents uploaded";
  }

  // Show modal
  document.getElementById("viewModal").style.display = "block";
  document.getElementById("modalBackdrop").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeViewModal() {
  document.getElementById("viewModal").style.display = "none";
  document.getElementById("modalBackdrop").style.display = "none";
  document.body.style.overflow = "auto"; // Re-enable scrolling
}

// Search by College or Course Name
function searchApplications() {
  const query = document
    .getElementById("searchApplications")
    .value.toLowerCase()
    .trim();
  const filtered = allRequests2.filter(
    (req) =>
      req.submittedBy?.collegeDetails?.collegeName
        ?.toLowerCase()
        .includes(query) || req.courseTitle?.toLowerCase().includes(query)
  );
  populateApplicationsTable(filtered);
}

// Filter by Status
function filterApplications() {
  const selected = document.getElementById("statusFilter").value;
  const filtered =
    selected === "all"
      ? allRequests
      : allRequests.filter((req) => req.status === selected);
  populateApplicationsTable(filtered);
}
async function sendAdminDecision(decision) {
  if (!currentAppId) {
    alert("No application selected.");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `http://localhost:5000/admin/decision/${currentAppId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      }
    );

    const result = await response.json();

    if (result.success) {
      alert(`Application ${decision} successfully.`);
      closeViewModal();
      fetchAffiliationRequests();
    } else {
      alert("Failed: " + result.message);
    }
  } catch (error) {
    console.error("Error sending admin decision:", error);
    alert("An error occurred.");
  }
}

function approveApplication() {
  if (confirm("Are you sure you want to approve this application?")) {
    sendAdminDecision("approved");
  }
}

function rejectApplication() {
  if (confirm("Are you sure you want to reject this application?")) {
    sendAdminDecision("rejected");
  }
}

function requestResubmission() {
  if (confirm("Request resubmission for this application?")) {
    sendAdminDecision("resubmit");
  }
}
