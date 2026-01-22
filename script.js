// Grade Calculator - No persistence, data will be lost on reload

// Constants
const DEFAULT_PERCENTAGE = 100;
const INITIAL_GRADE_ROWS = 5;
const MIN_GRADE = 1;
const MAX_GRADE = 6;

let grades = [];
let gradeCounter = 0;

// ========== PURE CALCULATION FUNCTIONS ==========

/**
 * Compute weighted average from grades array
 * @param {Array} gradesArray - Array of grade objects with value and percentage
 * @returns {{average: number|null, totalWeight: number}}
 */
function computeWeightedAverage(gradesArray) {
    const validGrades = gradesArray.filter(g => {
        const val = parseFloat(g.value);
        return g.value !== '' && Number.isFinite(val);
    });
    
    if (validGrades.length === 0) {
        return { average: null, totalWeight: 0 };
    }
    
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    
    validGrades.forEach(grade => {
        const val = parseFloat(grade.value);
        const weight = grade.percentage === '' ? 0 : parseFloat(grade.percentage);
        const weightNum = Number.isFinite(weight) ? weight : 0;
        totalWeightedGrade += val * weightNum;
        totalWeight += weightNum;
    });
    
    if (totalWeight === 0) {
        return { average: null, totalWeight: 0 };
    }
    
    return {
        average: totalWeightedGrade / totalWeight,
        totalWeight: totalWeight
    };
}

/**
 * Compute required grade for next assessment to reach target
 * @param {number} currentWeightedSum - Current sum of (grade * weight)
 * @param {number} currentWeight - Current total weight
 * @param {number} target - Target final grade
 * @param {number} nextWeight - Weight of next assessment
 * @returns {number|null}
 */
function computeRequiredGrade(currentWeightedSum, currentWeight, target, nextWeight) {
    if (!Number.isFinite(target) || !Number.isFinite(nextWeight) || nextWeight <= 0) {
        return null;
    }
    
    // Formula: (currentWeightedSum + required*nextWeight) / (currentWeight + nextWeight) = target
    // Solve for required: required = (target * (currentWeight + nextWeight) - currentWeightedSum) / nextWeight
    const required = (target * (currentWeight + nextWeight) - currentWeightedSum) / nextWeight;
    return required;
}

/**
 * Compute grade from points using Swiss formula
 * @param {number} achieved - Achieved points
 * @param {number} max - Maximum points
 * @param {number} threshold - Percentage needed for grade 6 (default 100)
 * @returns {{grade: number|null, percentage: number|null, status: string}}
 */
function computeGradeFromPoints(achieved, max, threshold = 100) {
    const achievedNum = parseFloat(achieved);
    const maxNum = parseFloat(max);
    const thresholdNum = parseFloat(threshold);
    
    // Check for invalid inputs
    if (!Number.isFinite(maxNum)) {
        return { grade: null, percentage: null, status: 'empty' };
    }
    
    if (maxNum <= 0) {
        return { grade: null, percentage: null, status: 'invalid_max' };
    }
    
    if (!Number.isFinite(achievedNum)) {
        return { grade: null, percentage: null, status: 'empty' };
    }
    
    if (achievedNum < 0) {
        return { grade: null, percentage: null, status: 'invalid_achieved' };
    }
    
    if (!Number.isFinite(thresholdNum) || thresholdNum <= 0 || thresholdNum > 100) {
        return { grade: null, percentage: null, status: 'invalid_threshold' };
    }
    
    const percentage = (achievedNum / maxNum) * 100;
    // Formula: grade = (percentage * 5) / threshold + 1
    const grade = (percentage * 5) / thresholdNum + 1;
    
    if (achievedNum > maxNum) {
        return { grade: grade, percentage: percentage, status: 'above_max' };
    }
    
    return { grade: grade, percentage: percentage, status: 'valid' };
}

// ========== STATE MANAGEMENT ==========

/**
 * Add a new grade row
 */
function addGrade() {
    gradeCounter++;
    const grade = {
        id: gradeCounter,
        value: '',
        percentage: DEFAULT_PERCENTAGE
    };
    grades.push(grade);
    renderGrades();
    
    // Focus the newly added grade input
    requestAnimationFrame(() => {
        const newRow = document.querySelector(`[data-grade-id="${grade.id}"]`);
        if (newRow) {
            const gradeInput = newRow.querySelector('[data-field="grade"]');
            if (gradeInput) {
                gradeInput.focus();
            }
        }
    });
}

/**
 * Delete a grade row by ID
 */
function deleteGrade(id) {
    grades = grades.filter(g => g.id !== id);
    renderGrades();
}

/**
 * Update grade value
 */
function updateGradeValue(id, value) {
    const grade = grades.find(g => g.id === id);
    if (grade) {
        grade.value = value === '' ? '' : value;
        updateDisplays();
    }
}

/**
 * Update grade percentage/weight
 */
function updateGradePercentage(id, percentage) {
    const grade = grades.find(g => g.id === id);
    if (grade) {
        grade.percentage = percentage === '' ? '' : percentage;
        updateDisplays();
    }
}

// ========== RENDERING ==========

/**
 * Render all grades in the table
 */
function renderGrades() {
    const tbody = document.getElementById('gradesBody');
    tbody.innerHTML = '';
    
    grades.forEach((grade, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-grade-id', grade.id);
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
                    data-field="grade"
                    data-id="${grade.id}"
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
                    data-field="percentage"
                    data-id="${grade.id}"
                >
            </td>
            <td>
                <button class="delete-btn" data-delete-id="${grade.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateDisplays();
}

/**
 * Update all display elements (final grade, total weight, required grade)
 */
function updateDisplays() {
    updateFinalGrade();
    updateRequiredGrade();
}

/**
 * Update final grade and total weight display
 */
function updateFinalGrade() {
    const { average, totalWeight } = computeWeightedAverage(grades);
    
    const finalGradeSpan = document.getElementById('finalGrade');
    const totalWeightDisplay = document.getElementById('totalWeightDisplay');
    
    if (average === null) {
        finalGradeSpan.textContent = '-';
    } else {
        finalGradeSpan.textContent = average.toFixed(2);
    }
    
    // Show integers without decimals, keep decimals when needed
    const weightDisplay = totalWeight % 1 === 0 ? totalWeight.toFixed(0) : totalWeight.toFixed(1);
    totalWeightDisplay.textContent = `Total weight: ${weightDisplay}%`;
}

/**
 * Update required grade display
 */
function updateRequiredGrade() {
    const targetInput = document.getElementById('targetGrade');
    const weightInput = document.getElementById('targetWeight');
    const targetGrade = parseFloat(targetInput.value);
    const nextWeight = parseFloat(weightInput.value);
    const requiredSection = document.getElementById('requiredGradeSection');
    const requiredGradeSpan = document.getElementById('requiredGrade');
    
    // Hide if no target or invalid
    if (!Number.isFinite(targetGrade)) {
        requiredSection.style.display = 'none';
        return;
    }
    
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
        requiredSection.style.display = 'none';
        return;
    }
    
    // Get valid grades
    const validGrades = grades.filter(g => {
        const val = parseFloat(g.value);
        return g.value !== '' && Number.isFinite(val);
    });
    
    // Calculate current weighted sum and total weight
    let currentWeightedSum = 0;
    let currentWeight = 0;
    
    validGrades.forEach(grade => {
        const val = parseFloat(grade.value);
        const weight = grade.percentage === '' ? 0 : parseFloat(grade.percentage);
        const weightNum = Number.isFinite(weight) ? weight : 0;
        currentWeightedSum += val * weightNum;
        currentWeight += weightNum;
    });
    
    const requiredGrade = computeRequiredGrade(currentWeightedSum, currentWeight, targetGrade, nextWeight);
    
    if (requiredGrade === null) {
        requiredSection.style.display = 'none';
        return;
    }
    
    requiredSection.style.display = 'flex';
    
    // In Swiss system: 6 is best, 1 is worst
    if (requiredGrade > 6) {
        requiredGradeSpan.textContent = 'Not achievable';
        requiredGradeSpan.style.color = '#ff4d4f';
    } else if (requiredGrade < 1) {
        requiredGradeSpan.textContent = 'Already achieved';
        requiredGradeSpan.style.color = '#2E6F40';
    } else {
        requiredGradeSpan.textContent = requiredGrade.toFixed(2);
        requiredGradeSpan.style.color = '#2E6F40';
    }
}

/**
 * Update points-to-grade display
 */
function updateGradeFromPoints() {
    const maxPoints = document.getElementById('maxPoints').value;
    const achievedPoints = document.getElementById('achievedPoints').value;
    const threshold = document.getElementById('gradeThreshold').value;
    const resultSpan = document.getElementById('calculatedGrade');
    const percentageSpan = document.getElementById('achievedPercentage');
    
    const result = computeGradeFromPoints(achievedPoints, maxPoints, threshold);
    
    if (result.status === 'empty') {
        resultSpan.textContent = '-';
        resultSpan.style.color = 'white';
        percentageSpan.textContent = '0%';
        percentageSpan.style.color = '#666';
    } else if (result.status === 'invalid_max') {
        resultSpan.textContent = 'Invalid max points';
        resultSpan.style.color = '#ff4d4f';
        percentageSpan.textContent = '0%';
        percentageSpan.style.color = '#666';
    } else if (result.status === 'invalid_achieved') {
        resultSpan.textContent = 'Invalid points';
        resultSpan.style.color = '#ff4d4f';
        percentageSpan.textContent = '0%';
        percentageSpan.style.color = '#666';
    } else if (result.status === 'invalid_threshold') {
        resultSpan.textContent = 'Invalid threshold';
        resultSpan.style.color = '#ff4d4f';
        percentageSpan.textContent = '0%';
        percentageSpan.style.color = '#666';
    } else if (result.status === 'above_max') {
        resultSpan.textContent = result.grade.toFixed(2) + ' (above max!)';
        resultSpan.style.color = '#ff4d4f';
        percentageSpan.textContent = result.percentage.toFixed(1) + '%';
        percentageSpan.style.color = '#ff4d4f';
    } else {
        resultSpan.textContent = result.grade.toFixed(2);
        resultSpan.style.color = 'white';
        percentageSpan.textContent = result.percentage.toFixed(1) + '%';
        percentageSpan.style.color = '#2E6F40';
    }
}

// ========== EVENT LISTENERS ==========

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add grade button
    document.getElementById('addGradeBtn').addEventListener('click', addGrade);
    
    // Event delegation for grades table
    const gradesBody = document.getElementById('gradesBody');
    gradesBody.addEventListener('input', (e) => {
        const target = e.target;
        const field = target.getAttribute('data-field');
        const id = parseInt(target.getAttribute('data-id'));
        
        if (field === 'grade') {
            updateGradeValue(id, target.value);
        } else if (field === 'percentage') {
            updateGradePercentage(id, target.value);
        }
    });
    
    // Event delegation for delete buttons
    gradesBody.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('button[data-delete-id]');
        
        if (deleteButton) {
            const deleteId = deleteButton.getAttribute('data-delete-id');
            deleteGrade(parseInt(deleteId));
        }
    });
    
    // Target grade inputs
    document.getElementById('targetGrade').addEventListener('input', updateRequiredGrade);
    document.getElementById('targetWeight').addEventListener('input', updateRequiredGrade);
    
    // Points converter inputs
    document.getElementById('maxPoints').addEventListener('input', updateGradeFromPoints);
    document.getElementById('achievedPoints').addEventListener('input', updateGradeFromPoints);
    document.getElementById('gradeThreshold').addEventListener('input', updateGradeFromPoints);
    
    // Dark mode toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Check saved preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.remove('moon-icon');
        themeIcon.classList.add('sun-icon');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.classList.toggle('moon-icon', !isDark);
        themeIcon.classList.toggle('sun-icon', isDark);
        localStorage.setItem('darkMode', isDark);
    });
}

/**
 * Initialize app with empty grade rows
 */
function init() {
    for (let i = 0; i < INITIAL_GRADE_ROWS; i++) {
        gradeCounter++;
        grades.push({
            id: gradeCounter,
            value: '',
            percentage: DEFAULT_PERCENTAGE
        });
    }
    renderGrades();
    initEventListeners();
}

// Start the app
init();
