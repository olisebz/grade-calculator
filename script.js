// Grade Calculator - No persistence, data will be lost on reload
let grades = [];
let gradeCounter = 0;

// Initialize with 5 empty grade rows
function init() {
    for (let i = 0; i < 5; i++) {
        addGrade();
    }
}

// Add a new grade row
function addGrade() {
    gradeCounter++;
    const grade = {
        id: gradeCounter,
        value: '',
        percentage: 100
    };
    grades.push(grade);
    renderGrades();
}

// Clear a grade
function deleteGrade(id) {
    const grade = grades.find(g => g.id === id);
    if (grade) {
        grade.value = '';
        grade.percentage = 100;
        renderGrades();
    }
}

// Update grade value
function updateGradeValue(id, value) {
    const grade = grades.find(g => g.id === id);
    if (grade) {
        grade.value = value === '' ? '' : parseFloat(value);
        calculateFinalGrade();
    }
}

// Update grade percentage
function updateGradePercentage(id, percentage) {
    const grade = grades.find(g => g.id === id);
    if (grade) {
        grade.percentage = percentage === '' ? 0 : parseFloat(percentage);
        calculateFinalGrade();
    }
}

// Render all grades in the table
function renderGrades() {
    const tbody = document.getElementById('gradesBody');
    tbody.innerHTML = '';
    
    grades.forEach((grade, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input 
                    type="number" 
                    step="0.1" 
                    min="1" 
                    max="6" 
                    placeholder="Enter grade (1-6)"
                    value="${grade.value}"
                    onchange="updateGradeValue(${grade.id}, this.value)"
                >
            </td>
            <td>
                <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="100" 
                    placeholder="Percentage"
                    value="${grade.percentage}"
                    onchange="updateGradePercentage(${grade.id}, this.value)"
                >
            </td>
            <td>
                <button class="delete-btn" onclick="deleteGrade(${grade.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    calculateFinalGrade();
}

// Calculate weighted average of all grades
function calculateFinalGrade() {
    // Filter out empty grades
    const validGrades = grades.filter(g => g.value !== '' && g.value !== null && !isNaN(g.value));
    
    if (validGrades.length === 0) {
        document.getElementById('finalGrade').textContent = '-';
        return;
    }
    
    let totalWeightedGrade = 0;
    let totalPercentage = 0;
    
    validGrades.forEach(grade => {
        totalWeightedGrade += grade.value * grade.percentage;
        totalPercentage += grade.percentage;
    });
    
    if (totalPercentage === 0) {
        document.getElementById('finalGrade').textContent = '-';
        return;
    }
    
    const finalGrade = totalWeightedGrade / totalPercentage;
    document.getElementById('finalGrade').textContent = finalGrade.toFixed(2);
}

document.getElementById('addGradeBtn').addEventListener('click', addGrade);

init();
