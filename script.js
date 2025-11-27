// ==========================================
// 1. DATA CONFIGURATION
// ==========================================

// This is the data you will update. 
// Format: pseudo (Login Name), pass (Password), rawAssess (Raw Score), daysPresent (0-19), mid (0-30)
let students = [
    { pseudo: "StudentA", pass: "pass1", rawAssess: 200, daysPresent: 19, mid: 25 },
    { pseudo: "StudentB", pass: "pass2", rawAssess: 180, daysPresent: 15, mid: 22 },
    { pseudo: "StudentC", pass: "pass3", rawAssess: 100, daysPresent: 10, mid: 15 },
    // Add more students here...
];

const ADMIN_USER = "toa77";
const ADMIN_PASS = "tokuchi77english";

// ==========================================
// 2. CORE LOGIC
// ==========================================

let currentUser = null;
let maxRawScore = 0;

// Initialize
window.onload = function() {
    calculateMaxScore();
};

function calculateMaxScore() {
    // Find the highest raw score in the class
    maxRawScore = Math.max(...students.map(s => s.rawAssess));
    if (maxRawScore === 0) maxRawScore = 1; // Prevent division by zero
}

function getAssessmentScore(raw) {
    // Logic: (Student / Max) * 20. Floor to nearest integer.
    // Example: 191/200 = 0.955 * 20 = 19.1 -> 19.
    let scaled = (raw / maxRawScore) * 20;
    return Math.floor(scaled);
}

function getAttendanceScore(days) {
    // Logic: Start at 1. Max 20 (19 days + 1 base).
    // If daysPresent is 0, score is 1. If 19, score is 20.
    return 1 + parseInt(days);
}

// ==========================================
// 3. UI HANDLERS
// ==========================================

function handleLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');

    // Admin Login
    if (u === ADMIN_USER && p === ADMIN_PASS) {
        currentUser = "ADMIN";
        showAdminPanel();
        return;
    }

    // Student Login
    const student = students.find(s => s.pseudo === u && s.pass === p);
    if (student) {
        currentUser = student;
        loadStudentDashboard(student);
        errorMsg.classList.add('hidden');
    } else {
        errorMsg.classList.remove('hidden');
    }
}

function loadStudentDashboard(student) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').onclick = () => location.reload();
    document.getElementById('welcomeMsg').innerText = `Hello, ${student.pseudo}`;

    // 1. Load Assessment
    const myAssessScore = getAssessmentScore(student.rawAssess);
    document.getElementById('assessScoreDisplay').innerText = myAssessScore;

    // Build Leaderboard (Anonymous)
    const leaderboardBody = document.getElementById('leaderboardBody');
    leaderboardBody.innerHTML = '';
    
    // Sort students by scaled score descending
    let sortedStudents = [...students].map(s => getAssessmentScore(s.rawAssess))
                                      .sort((a, b) => b - a);
    
    sortedStudents.forEach((score, index) => {
        let row = `<tr><td>${index + 1}</td><td>${score}</td></tr>`;
        leaderboardBody.innerHTML += row;
    });

    // 2. Load Attendance
    document.getElementById('daysPresentDisplay').innerText = `${student.daysPresent} / 19`;
    document.getElementById('attendScoreDisplay').innerText = `${getAttendanceScore(student.daysPresent)} / 20`;

    // 3. Load Overall Basics
    const attendScore = getAttendanceScore(student.daysPresent);
    document.getElementById('ovAssess').innerText = myAssessScore;
    document.getElementById('ovAttend').innerText = attendScore;
    document.getElementById('ovMid').innerText = student.mid;
    
    // Trigger calculation with 0 final initially
    calculateTotal();
}

function calculateTotal() {
    if (!currentUser || currentUser === "ADMIN") return;

    const myAssess = getAssessmentScore(currentUser.rawAssess);
    const myAttend = getAttendanceScore(currentUser.daysPresent);
    const myMid = parseFloat(currentUser.mid);
    
    const finalInput = document.getElementById('finalInput').value;
    const projectedFinal = finalInput ? parseFloat(finalInput) : 0;
    
    // Validate Input (Max 30)
    const inputField = document.getElementById('finalInput');
    if (projectedFinal > 30) {
        inputField.style.borderColor = "red";
    } else {
        inputField.style.borderColor = "#ddd";
    }

    const total = myAssess + myAttend + myMid + projectedFinal;
    document.getElementById('projectedTotal').innerText = total.toFixed(1);

    // Calculate Requirements
    const currentTotalWithoutFinal = myAssess + myAttend + myMid;
    
    updateRequirement('req80', 80, currentTotalWithoutFinal);
    updateRequirement('req75', 75, currentTotalWithoutFinal);
    updateRequirement('req70', 70, currentTotalWithoutFinal);
}

function updateRequirement(elementId, target, current) {
    const el = document.getElementById(elementId);
    const needed = target - current;

    if (needed <= 0) {
        el.innerText = "Achieved!";
        el.className = "green-text";
    } else if (needed > 30) {
        el.innerText = `${needed.toFixed(1)} (Not possible)`;
        el.className = "red-text";
    } else {
        el.innerText = `${needed.toFixed(1)} / 30`;
        el.className = "";
    }
}

// Navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function toggleAssessmentView(view) {
    if (view === 'personal') {
        document.getElementById('assessPersonal').classList.remove('hidden');
        document.getElementById('assessLeaderboard').classList.add('hidden');
    } else {
        document.getElementById('assessPersonal').classList.add('hidden');
        document.getElementById('assessLeaderboard').classList.remove('hidden');
    }
}

// ==========================================
// 4. ADMIN PANEL FUNCTIONS
// ==========================================

function showAdminPanel() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').onclick = () => location.reload();
    renderAdminTable();
}

function renderAdminTable() {
    let html = `<table>
        <thead>
            <tr>
                <th>Pseudo</th>
                <th>Pass</th>
                <th>Raw Assess</th>
                <th>Days (0-19)</th>
                <th>Mid (0-30)</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>`;
    
    students.forEach((s, index) => {
        html += `
            <tr>
                <td><input class="admin-input" type="text" value="${s.pseudo}" id="pseudo_${index}"></td>
                <td><input class="admin-input" type="text" value="${s.pass}" id="pass_${index}"></td>
                <td><input class="admin-input" type="number" value="${s.rawAssess}" id="raw_${index}"></td>
                <td><input class="admin-input" type="number" value="${s.daysPresent}" id="days_${index}"></td>
                <td><input class="admin-input" type="number" value="${s.mid}" id="mid_${index}"></td>
                <td><button onclick="removeStudent(${index})" style="background:#e74c3c; padding:5px 10px;">X</button></td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    document.getElementById('adminTableContainer').innerHTML = html;
}

function addNewStudent() {
    students.push({ pseudo: "NewUser", pass: "123", rawAssess: 0, daysPresent: 0, mid: 0 });
    renderAdminTable();
}

function removeStudent(index) {
    if(confirm("Delete this student?")) {
        students.splice(index, 1);
        renderAdminTable();
    }
}

function exportData() {
    // 1. Scrape current values from inputs
    students.forEach((s, index) => {
        s.pseudo = document.getElementById(`pseudo_${index}`).value;
        s.pass = document.getElementById(`pass_${index}`).value;
        s.rawAssess = parseInt(document.getElementById(`raw_${index}`).value);
        s.daysPresent = parseInt(document.getElementById(`days_${index}`).value);
        s.mid = parseFloat(document.getElementById(`mid_${index}`).value);
    });

    // 2. Create the string to copy
    const exportString = `let students = ${JSON.stringify(students, null, 4)};`;
    
    // 3. Show in text area
    const area = document.getElementById('exportArea');
    area.value = exportString;
    area.select();
    document.execCommand("copy");
    alert("Data copied to clipboard! \n\nNOW: Go to script.js in your GitHub repository and replace the 'let students = [...]' section with this new code.");
}
