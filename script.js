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

// Delete a grade row
function deleteGrade(id) {
    grades = grades.filter(g => g.id !== id);
    renderGrades();
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
    
    // Recalculate required grade if target is set
    calculateRequiredGrade();
}

// Calculate what grade is needed to reach target
function calculateRequiredGrade() {
    const targetInput = document.getElementById('targetGrade');
    const weightInput = document.getElementById('targetWeight');
    const targetGrade = parseFloat(targetInput.value);
    const nextWeight = parseFloat(weightInput.value) || 100;
    const requiredSection = document.getElementById('requiredGradeSection');
    const requiredGradeSpan = document.getElementById('requiredGrade');
    
    // Hide if no target or invalid
    if (!targetGrade || isNaN(targetGrade)) {
        requiredSection.style.display = 'none';
        return;
    }
    
    // Get valid grades
    const validGrades = grades.filter(g => g.value !== '' && g.value !== null && !isNaN(g.value));
    
    if (validGrades.length === 0) {
        requiredSection.style.display = 'none';
        return;
    }
    
    // Calculate current weighted sum and total percentage
    let totalWeightedGrade = 0;
    let totalPercentage = 0;
    
    validGrades.forEach(grade => {
        totalWeightedGrade += grade.value * grade.percentage;
        totalPercentage += grade.percentage;
    });
    
    // Formula: (current_weighted + required*weight) / (total_percentage + weight) = target
    // Solve for required: required = (target * (total_percentage + weight) - current_weighted) / weight
    const requiredGrade = (targetGrade * (totalPercentage + nextWeight) - totalWeightedGrade) / nextWeight;
    
    requiredSection.style.display = 'flex';
    
    // In Swiss system: 6 is best, 1 is worst
    if (requiredGrade > 6) {
        requiredGradeSpan.textContent = 'Already achieved!';
        requiredGradeSpan.style.color = '#2E6F40';
    } else if (requiredGrade < 1) {
        requiredGradeSpan.textContent = 'Not achievable';
        requiredGradeSpan.style.color = '#ff4d4f';
    } else {
        requiredGradeSpan.textContent = requiredGrade.toFixed(2);
        requiredGradeSpan.style.color = '#2E6F40';
    }
}

// Calculate grade from points
function calculateGradeFromPoints() {
    const maxPoints = parseFloat(document.getElementById('maxPoints').value);
    const achievedPoints = parseFloat(document.getElementById('achievedPoints').value);
    const resultSpan = document.getElementById('calculatedGrade');
    
    // Validate inputs
    if (!maxPoints || !achievedPoints || isNaN(maxPoints) || isNaN(achievedPoints)) {
        resultSpan.textContent = '-';
        resultSpan.style.color = '#333';
        return;
    }
    
    if (maxPoints <= 0) {
        resultSpan.textContent = 'Invalid max points';
        resultSpan.style.color = '#ff4d4f';
        return;
    }
    
    if (achievedPoints < 0) {
        resultSpan.textContent = 'Invalid points';
        resultSpan.style.color = '#ff4d4f';
        return;
    }
    
    // Formula: Note = (erreichtePunktzahl * 5) / MAXPUNKTZAHL + 1
    const grade = (achievedPoints * 5) / maxPoints + 1;
    
    // Display result
    if (grade > 6) {
        resultSpan.textContent = grade.toFixed(2) + ' (above max!)';
        resultSpan.style.color = '#ff4d4f';
    } else if (grade < 1) {
        resultSpan.textContent = grade.toFixed(2) + ' (below min!)';
        resultSpan.style.color = '#ff4d4f';
    } else {
        resultSpan.textContent = grade.toFixed(2);
        resultSpan.style.color = 'white';
    }
}

document.getElementById('addGradeBtn').addEventListener('click', addGrade);

init();
