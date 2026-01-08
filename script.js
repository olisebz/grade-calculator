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

// Delete a grade
function deleteGrade(id) {
    grades = grades.filter(g => g.id !== id);
    if (grades.length === 0) {
        addGrade(); // Keep at least one empty row
    } else {
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
    let totalWeight = 0;
    
    validGrades.forEach(grade => {
        // Convert percentage (0-100) to weight (0-1)
        const weight = grade.percentage / 100;
        totalWeightedGrade += grade.value * weight;
        totalWeight += weight;
    });
    
    if (totalWeight === 0) {
        document.getElementById('finalGrade').textContent = '-';
        return;
    }
    
    const finalGrade = totalWeightedGrade / totalWeight;
    document.getElementById('finalGrade').textContent = finalGrade.toFixed(2);
    
    // Recalculate required grade if target is set
    calculateRequiredGrade();
}

// Calculate what grade is needed to reach target
function calculateRequiredGrade() {
    const targetInput = document.getElementById('targetGrade');
    const weightInput = document.getElementById('targetWeight');
    const targetGrade = parseFloat(targetInput.value);
    const nextWeightPercent = parseFloat(weightInput.value) || 100;
    const nextWeight = nextWeightPercent / 100; // Convert to decimal
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
    
    // Calculate current weighted sum and total weight
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    
    validGrades.forEach(grade => {
        const weight = grade.percentage / 100;
        totalWeightedGrade += grade.value * weight;
        totalWeight += weight;
    });
    
    const currentFinalGrade = totalWeightedGrade / totalWeight;
    
    // Check if target is already achieved (Swiss grading: higher is better)
    if (currentFinalGrade >= targetGrade) {
        requiredSection.style.display = 'flex';
        requiredGradeSpan.textContent = 'Already achieved!';
        requiredGradeSpan.style.color = '#2E6F40';
        return;
    }
    
    // Formula: (current_weighted + required*nextWeight) / (totalWeight + nextWeight) = target
    // Solve for required: required = (target * (totalWeight + nextWeight) - current_weighted) / nextWeight
    const requiredGrade = (targetGrade * (totalWeight + nextWeight) - totalWeightedGrade) / nextWeight;
    
    requiredSection.style.display = 'flex';
    
    if (requiredGrade > 6) {
        requiredGradeSpan.textContent = 'Not achievable';
        requiredGradeSpan.style.color = '#ff4d4f';
    } else if (requiredGrade < 1) {
        requiredGradeSpan.textContent = 'Not achievable';
        requiredGradeSpan.style.color = '#ff4d4f';
    } else {
        requiredGradeSpan.textContent = requiredGrade.toFixed(2);
        requiredGradeSpan.style.color = '#2E6F40';
    }
}

document.getElementById('addGradeBtn').addEventListener('click', addGrade);

init();
