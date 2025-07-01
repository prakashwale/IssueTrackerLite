// Parse query parameter for index
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

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

const idx = parseInt(getQueryParam('idx'), 10);
const issues = getUserIssues();
const editTitle = document.getElementById('editTitle');
const editDescription = document.getElementById('editDescription');
const editPriority = document.getElementById('editPriority');
const editStatus = document.getElementById('editStatus');
const editMsg = document.getElementById('editMsg');

if (isNaN(idx) || !issues[idx]) {
    editMsg.textContent = 'Issue not found.';
    editMsg.className = 'text-danger';
    document.getElementById('editIssueForm').style.display = 'none';
} else {
    // Populate form
    const issue = issues[idx];
    editTitle.value = issue.title;
    editDescription.value = issue.description;
    editPriority.value = issue.priority;
    editStatus.value = issue.status || 'Open';
}

document.getElementById('editIssueForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (isNaN(idx) || !issues[idx]) return;
    issues[idx].title = editTitle.value.trim();
    issues[idx].description = editDescription.value.trim();
    issues[idx].priority = editPriority.value;
    issues[idx].status = editStatus.value;
    saveUserIssues(issues);
    editMsg.textContent = 'Issue updated! Redirecting...';
    editMsg.className = 'text-success';
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
}); 