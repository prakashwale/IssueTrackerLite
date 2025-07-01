// Issue Tracker Logic
const issueForm = document.getElementById('issueForm');
const issueList = document.getElementById('issueList');
const issueDisplay = document.getElementById('issueDisplay');

// --- Edit, Filter, and Search Features ---
let editIndex = null;
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTitle = document.getElementById('editTitle');
const editDescription = document.getElementById('editDescription');
const editPriority = document.getElementById('editPriority');
const editStatus = document.getElementById('editStatus');
const cancelBtn = document.querySelector('#editModal .cancel-btn');

// Filter and search controls
const filterPriority = document.getElementById('filterPriority');
const filterResolved = document.getElementById('filterResolved');
const searchBox = document.getElementById('searchBox');

// --- User-specific Issues and Sorting ---
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}
function getUserIssues() {
    const user = getCurrentUser();
    if (!user) return [];
    const allIssues = JSON.parse(localStorage.getItem('user_issues') || '{}');
    return allIssues[user] || [];
}
function saveUserIssues(issues) {
    const user = getCurrentUser();
    if (!user) return;
    let allIssues = JSON.parse(localStorage.getItem('user_issues') || '{}');
    allIssues[user] = issues;
    localStorage.setItem('user_issues', JSON.stringify(allIssues));
}

const sortIssues = document.getElementById('sortIssues');

// --- Bootstrap Modal Support ---
let editModalInstance = null;
if (typeof bootstrap !== 'undefined') {
    editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
}

function renderIssues() {
    const issueTableBody = document.getElementById('issueTableBody');
    if (issueTableBody) issueTableBody.innerHTML = '';
    let issues = getUserIssues();
    // Filtering
    if (filterPriority && filterPriority.value !== 'All') {
        issues = issues.filter(issue => issue.priority === filterPriority.value);
    }
    if (filterResolved && filterResolved.value !== 'all') {
        issues = issues.filter(issue => {
            if (filterResolved.value === 'resolved') return issue.status === 'Closed';
            if (filterResolved.value === 'unresolved') return issue.status !== 'Closed';
            return true;
        });
    }
    // Search
    if (searchBox && searchBox.value.trim() !== '') {
        const q = searchBox.value.trim().toLowerCase();
        issues = issues.filter(issue =>
            issue.title.toLowerCase().includes(q) ||
            issue.description.toLowerCase().includes(q)
        );
    }
    // Sorting
    if (sortIssues) {
        if (sortIssues.value === 'oldest') {
            issues = [...issues].reverse();
        } else if (sortIssues.value === 'priorityHigh') {
            issues = [...issues].sort((a, b) => priorityValue(b.priority) - priorityValue(a.priority));
        } else if (sortIssues.value === 'priorityLow') {
            issues = [...issues].sort((a, b) => priorityValue(a.priority) - priorityValue(b.priority));
        }
        // Default is newest (original order)
    }
    if (!issues.length && issueTableBody) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center text-muted">No issues yet.</td>';
        issueTableBody.appendChild(tr);
        return;
    }
    issues.forEach((issue, idx) => {
        const tr = document.createElement('tr');
        tr.className = issue.status === 'Closed' ? 'resolved' : '';
        tr.innerHTML = `
            <td><span class="fw-bold">${issue.title}</span></td>
            <td><span class="issue-priority priority-${issue.priority}">${issue.priority}</span></td>
            <td>${issue.description}</td>
            <td><span class="badge status-badge status-${(issue.status || 'Open').replace(/ /g, '').toLowerCase()}">${issue.status || 'Open'}</span></td>
            <td class="issue-table-actions">
                <button class="btn btn-warning btn-sm edit-btn">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn">Delete</button>
            </td>
        `;
        // Actions
        tr.querySelector('.delete-btn').onclick = () => {
            const all = getUserIssues();
            const realIdx = getUserIssues().findIndex(i => i.title === issue.title && i.priority === issue.priority && i.description === issue.description && (i.status || 'Open') === (issue.status || 'Open'));
            if (realIdx !== -1) {
                all.splice(realIdx, 1);
                saveUserIssues(all);
                renderIssues();
            }
        };
        tr.querySelector('.edit-btn').onclick = () => {
            // Find the correct index in the full user issues array
            const all = getUserIssues();
            const realIdx = getUserIssues().findIndex(i => i.title === issue.title && i.priority === issue.priority && i.description === issue.description && (i.status || 'Open') === (issue.status || 'Open'));
            if (realIdx !== -1) {
                window.location.href = `edit.html?idx=${realIdx}`;
            }
        };
        if (issueTableBody) issueTableBody.appendChild(tr);
    });
}
function priorityValue(priority) {
    if (priority === 'High') return 3;
    if (priority === 'Medium') return 2;
    return 1;
}
// Filter/search/sort event listeners
if (filterPriority) filterPriority.addEventListener('change', renderIssues);
if (filterResolved) filterResolved.addEventListener('change', renderIssues);
if (searchBox) searchBox.addEventListener('input', renderIssues);
if (sortIssues) sortIssues.addEventListener('change', renderIssues);

// Edit modal logic
if (cancelBtn) cancelBtn.onclick = () => {
    if (editModalInstance) editModalInstance.hide();
    editIndex = null;
};
if (editForm) editForm.onsubmit = function(e) {
    e.preventDefault();
    if (editIndex !== null) {
        const all = getUserIssues();
        all[editIndex].title = editTitle.value.trim();
        all[editIndex].description = editDescription.value.trim();
        all[editIndex].priority = editPriority.value;
        all[editIndex].status = editStatus.value;
        saveUserIssues(all);
        renderIssues();
        if (editModalInstance) editModalInstance.hide();
        editIndex = null;
    }
};

issueForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    if (!title || !description || !priority) {
        issueDisplay.style.display = 'block';
        issueDisplay.style.background = '#ffe9e9';
        issueDisplay.style.border = '1px solid #ffb2b2';
        issueDisplay.textContent = 'Please fill in all fields.';
        return;
    }
    const issues = getUserIssues();
    issues.unshift({ title, description, priority, status: 'Open' });
    saveUserIssues(issues);
    renderIssues();
    issueForm.reset();
    issueDisplay.style.display = 'block';
    issueDisplay.style.background = '#e9ffe9';
    issueDisplay.style.border = '1px solid #b2ffb2';
    issueDisplay.textContent = 'Issue added!';
    setTimeout(() => { issueDisplay.style.display = 'none'; }, 1200);
});

// Logout button logic for both mobile and desktop
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnDesktop = document.getElementById('logoutBtn-desktop');
[logoutBtn, logoutBtnDesktop].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', function() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
});

// Call renderIssues on page load to show existing issues
renderIssues(); 