/**
 * Grade Calculator Application
 * Logic for calculating weighted averages and grade conversions.
 */

// ==========================================
// Constants & Configuration
// ==========================================
const CONFIG = {
    DEFAULT_PERCENTAGE: 100,
    INITIAL_ROWS: 5,
    MIN_GRADE: 1,
    MAX_GRADE: 6,
    SELECTORS: {
        GRADES_TABLE_BODY: '#gradesBody',
        ADD_BTN: '#addGradeBtn',
        TOTAL_WEIGHT: '#totalWeightDisplay',
        FINAL_GRADE: '#finalGrade',
        TARGET_GRADE: '#targetGrade',
        TARGET_WEIGHT: '#targetWeight',
        REQUIRED_SECTION: '#requiredGradeSection',
        REQUIRED_GRADE: '#requiredGrade',
        THEME_TOGGLE: '#themeToggle',

        // Converter
        MAX_POINTS: '#maxPoints',
        ACHIEVED_POINTS: '#achievedPoints',
        THRESHOLD: '#gradeThreshold',
        ACHIEVED_PERCENTAGE: '#achievedPercentage',
        CALCULATED_GRADE: '#calculatedGrade'
    }
};

// State
let state = {
    grades: [],
    nextId: 1
};

// ==========================================
// Core Logic (Pure Functions)
// ==========================================

/**
 * Calculates the weighted average of valid grades.
 * @param {Array} grades - Array of grade objects { value, weight }
 * @returns {Object} { average, totalWeight }
 */
const calculateAverage = (grades) => {
    const validGrades = grades.filter(g =>
        g.value !== '' &&
        !isNaN(parseFloat(g.value))
    );

    if (validGrades.length === 0) {
        return { average: null, totalWeight: 0 };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    validGrades.forEach(g => {
        const val = parseFloat(g.value);
        const weight = parseFloat(g.weight) || 0;

        weightedSum += val * weight;
        totalWeight += weight;
    });

    return {
        average: totalWeight === 0 ? null : weightedSum / totalWeight,
        totalWeight
    };
};

/**
 * Calculates the grade needed to achieve a target average.
 * @param {Array} grades - Current grades
 * @param {number} target - Target grade
 * @param {number} nextWeight - Weight of the next exam
 * @returns {number|null} Required grade or null if invalid
 */
const calculateRequired = (grades, target, nextWeight) => {
    if (!target || !nextWeight || nextWeight <= 0) return null;

    const { average, totalWeight } = calculateAverage(grades);

    // If no grades yet, required is simply the target
    if (average === null) return target;

    const currentWeightedSum = grades.reduce((sum, g) => {
        const val = parseFloat(g.value);
        const w = parseFloat(g.weight) || 0;
        return (g.value && !isNaN(val)) ? sum + (val * w) : sum;
    }, 0);

    // Formula: (currentSum + required * nextWeight) / (totalWeight + nextWeight) = target
    const required = (target * (totalWeight + nextWeight) - currentWeightedSum) / nextWeight;

    return required;
};

/**
 * Swiss Grade Formula: (Points / Max) * 5 + 1
 * With custom scale support (e.g., 6.0 at 95% points)
 */
const calculateFromPoints = (achieved, max, scale = 100) => {
    const a = parseFloat(achieved);
    const m = parseFloat(max);
    const s = parseFloat(scale);

    if (isNaN(a) || isNaN(m) || m <= 0 || s <= 0) {
        return { grade: null, percentage: 0 };
    }

    const percentage = (a / m) * 100;

    // Adjusted formula based on scale (scale is the percentage where you get a 6.0)
    // Basic: Grade = (Percentage * 5) / 100 + 1
    // Scaled: Grade = (Percentage * 5) / scale + 1
    const grade = (percentage * 5) / s + 1;

    return { grade, percentage };
};

// ==========================================
// DOM Manipulation
// ==========================================

const elements = {};

const initElements = () => {
    Object.entries(CONFIG.SELECTORS).forEach(([key, selector]) => {
        elements[key] = document.querySelector(selector);
    });
};

const createGradeRow = (grade) => {
    const tr = document.createElement('tr');
    tr.dataset.id = grade.id;
    tr.innerHTML = `
        <td>${state.grades.findIndex(g => g.id === grade.id) + 1}</td>
        <td>
            <input type="number" 
                   value="${grade.value}" 
                   placeholder="Grade" 
                   min="${CONFIG.MIN_GRADE}" 
                   max="${CONFIG.MAX_GRADE}" 
                   step="0.1" 
                   class="grade-input">
        </td>
        <td>
            <input type="number" 
                   value="${grade.weight}" 
                   placeholder="100" 
                   min="0" 
                   step="any" 
                   class="weight-input">
        </td>
        <td>
            <button class="btn-delete" aria-label="Delete grade">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </td>
    `;
    return tr;
};

const renderGrades = () => {
    elements.GRADES_TABLE_BODY.innerHTML = '';
    state.grades.forEach((grade, index) => {
        // Update index in state just effectively for UI logic if needed, 
        // but id is source of truth.
        const row = createGradeRow(grade);
        // Correct the index display
        row.querySelector('td:first-child').textContent = index + 1;
        elements.GRADES_TABLE_BODY.appendChild(row);
    });
    updateEstimations();
};

const updateEstimations = () => {
    // 1. Final Grade
    const { average, totalWeight } = calculateAverage(state.grades);

    if (average !== null) {
        elements.FINAL_GRADE.textContent = average.toFixed(2);
    } else {
        elements.FINAL_GRADE.textContent = '-';
    }

    elements.TOTAL_WEIGHT.textContent = `Total Weight: ${parseFloat(totalWeight.toFixed(2))}%`;

    // 2. Required Grade
    const target = parseFloat(elements.TARGET_GRADE.value);
    const nextWeight = parseFloat(elements.TARGET_WEIGHT.value);

    if (target && nextWeight) {
        const required = calculateRequired(state.grades, target, nextWeight);

        elements.REQUIRED_SECTION.setAttribute('aria-hidden', 'false');
        elements.REQUIRED_GRADE.textContent = required.toFixed(2);

        // Color coding
        if (required > 6) {
            elements.REQUIRED_GRADE.style.color = 'var(--error)';
            elements.REQUIRED_GRADE.textContent = '> 6.0';
        } else if (required < 1) {
            elements.REQUIRED_GRADE.style.color = 'var(--success)';
            elements.REQUIRED_GRADE.textContent = 'Done!';
        } else {
            elements.REQUIRED_GRADE.style.color = 'var(--primary)';
        }
    } else {
        elements.REQUIRED_SECTION.setAttribute('aria-hidden', 'true');
    }
};

const updateConverter = () => {
    const max = elements.MAX_POINTS.value;
    const achieved = elements.ACHIEVED_POINTS.value;
    const threshold = elements.THRESHOLD.value;

    const { grade, percentage } = calculateFromPoints(achieved, max, threshold);

    if (grade !== null) {
        elements.CALCULATED_GRADE.textContent = grade.toFixed(2);
        elements.ACHIEVED_PERCENTAGE.textContent = `${percentage.toFixed(1)}%`;


    } else {
        elements.CALCULATED_GRADE.textContent = '-';
        elements.ACHIEVED_PERCENTAGE.textContent = '-';
    }
};

// ==========================================
// Event Handlers
// ==========================================

const handleAddGrade = () => {
    state.grades.push({
        id: state.nextId++,
        value: '',
        weight: CONFIG.DEFAULT_PERCENTAGE
    });
    renderGrades();

    // Focus new input
    const rows = elements.GRADES_TABLE_BODY.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
        const input = lastRow.querySelector('.grade-input');
        if (input) input.focus();
    }
};

const handleTableClick = (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    const row = btn.closest('tr');
    const id = parseInt(row.dataset.id);

    state.grades = state.grades.filter(g => g.id !== id);
    renderGrades();
};

const handleTableInput = (e) => {
    const row = e.target.closest('tr');
    if (!row) return;

    const id = parseInt(row.dataset.id);
    const gradeToUpdate = state.grades.find(g => g.id === id);

    if (e.target.classList.contains('grade-input')) {
        gradeToUpdate.value = e.target.value;
    } else if (e.target.classList.contains('weight-input')) {
        gradeToUpdate.weight = e.target.value;
    }

    updateEstimations();
};

const handleThemeToggle = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
};

// ==========================================
// Initialization
// ==========================================

const init = () => {
    initElements();

    // Initial Data
    for (let i = 0; i < CONFIG.INITIAL_ROWS; i++) {
        state.grades.push({
            id: state.nextId++,
            value: '',
            weight: CONFIG.DEFAULT_PERCENTAGE
        });
    }

    renderGrades();

    // Listeners
    elements.ADD_BTN.addEventListener('click', handleAddGrade);
    elements.GRADES_TABLE_BODY.addEventListener('click', handleTableClick);
    elements.GRADES_TABLE_BODY.addEventListener('input', handleTableInput);

    elements.TARGET_GRADE.addEventListener('input', updateEstimations);
    elements.TARGET_WEIGHT.addEventListener('input', updateEstimations);

    [elements.MAX_POINTS, elements.ACHIEVED_POINTS, elements.THRESHOLD].forEach(el => {
        el.addEventListener('input', updateConverter);
    });

    // Theme Management
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    elements.THEME_TOGGLE.addEventListener('click', handleThemeToggle);
};

// Start
document.addEventListener('DOMContentLoaded', init);
