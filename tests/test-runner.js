/**
 * TimeSync Test Runner
 * Simple test framework for running unit tests
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = null;
    }

    describe(suiteName, testFunction) {
        this.currentSuite = suiteName;
        testFunction();
        this.currentSuite = null;
    }

    it(testName, testFunction) {
        const fullName = this.currentSuite ? `${this.currentSuite}: ${testName}` : testName;
        this.tests.push({
            name: fullName,
            test: testFunction,
            suite: this.currentSuite
        });
    }

    async runTests(filter = null) {
        this.results = [];
        const testsToRun = filter ? this.tests.filter(filter) : this.tests;
        
        for (const testCase of testsToRun) {
            try {
                await testCase.test();
                this.results.push({
                    name: testCase.name,
                    status: 'pass',
                    message: 'Test passed'
                });
            } catch (error) {
                this.results.push({
                    name: testCase.name,
                    status: 'fail',
                    message: error.message || 'Test failed'
                });
            }
        }

        this.displayResults();
        return this.results;
    }

    displayResults() {
        const resultsDiv = document.getElementById('testResults');
        const statsDiv = document.getElementById('testStats');
        
        let output = '';
        let passed = 0;
        let failed = 0;

        this.results.forEach(result => {
            const status = result.status === 'pass' ? '✓' : '✗';
            const className = result.status === 'pass' ? 'test-pass' : 'test-fail';
            
            output += `<div class="${className}" style="margin: 5px 0; padding: 8px; border-radius: 4px;">
                ${status} ${result.name}
                ${result.message !== 'Test passed' ? `<br>&nbsp;&nbsp;&nbsp;&nbsp;${result.message}` : ''}
            </div>`;
            
            if (result.status === 'pass') passed++;
            else failed++;
        });

        resultsDiv.innerHTML = output || 'No tests run';
        
        // Update stats
        document.getElementById('totalTests').textContent = this.results.length;
        document.getElementById('passedTests').textContent = passed;
        document.getElementById('failedTests').textContent = failed;
        statsDiv.style.display = this.results.length > 0 ? 'flex' : 'none';
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toThrow: () => {
                let threw = false;
                try {
                    actual();
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw an error');
                }
            }
        };
    }
}

// Global test runner instance
const testRunner = new TestRunner();
const { describe, it, expect } = testRunner;

// Test control functions
async function runAllTests() {
    await testRunner.runTests();
}

async function runCoreTests() {
    await testRunner.runTests(test => test.suite === 'Core Functionality');
}

async function runUITests() {
    await testRunner.runTests(test => test.suite === 'UI Tests');
}

async function runValidationTests() {
    await testRunner.runTests(test => test.suite === 'Validation Tests');
}

async function runLimitTests() {
    await testRunner.runTests(test => test.suite === 'Limit Tests');
}

function clearResults() {
    document.getElementById('testResults').innerHTML = 'Results cleared. Click a test button to run tests.';
    document.getElementById('testStats').style.display = 'none';
}

// Mock DOM elements for testing
function createMockDOM() {
    // Create mock elements that TimeSync expects
    const mockElements = {
        'pollTitle': { value: '', focus: () => {}, addEventListener: () => {} },
        'startTime': { value: '09:00', addEventListener: () => {} },
        'endTime': { value: '17:00', addEventListener: () => {} },
        'userName': { value: '', focus: () => {}, addEventListener: () => {} },
        'startDate': { value: '', min: '', addEventListener: () => {} },
        'endDate': { value: '', min: '', addEventListener: () => {} },
        'generalDaysBtn': { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
        'specificDatesBtn': { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
        'generalDaysGroup': { style: { display: 'block' } },
        'specificDatesGroup': { style: { display: 'none' } },
        'selectedDates': { innerHTML: '' },
        'themeToggle': { addEventListener: () => {} },
        'createPollBtn': { addEventListener: () => {} },
        'addUserBtn': { addEventListener: () => {} },
        'shareBtn': { addEventListener: () => {} },
        'copyCalendarBtn': { addEventListener: () => {} },
        'newPollBtn': { addEventListener: () => {} },
        'pollCreator': { style: { display: 'block' } },
        'pollDisplay': { style: { display: 'none' } },
        'pollTitleDisplay': { textContent: '' },
        'currentTimezone': { textContent: '' },
        'daysHeader': { innerHTML: '', style: { gridTemplateColumns: '' } },
        'availabilityGrid': { innerHTML: '' },
        'participantsList': { innerHTML: '' },
        'suggestionsSection': { style: { display: 'none' } },
        'suggestionsList': { innerHTML: '' },
        'toast': { textContent: '', className: '', classList: { add: () => {}, remove: () => {} } }
    };

    // Mock getElementById
    const originalGetElementById = document.getElementById;
    document.getElementById = function(id) {
        return mockElements[id] || { 
            addEventListener: () => {}, 
            style: {}, 
            classList: { add: () => {}, remove: () => {} },
            innerHTML: '',
            textContent: '',
            value: ''
        };
    };

    // Mock querySelectorAll for day buttons
    document.querySelectorAll = function(selector) {
        if (selector === '.day-btn') {
            return Array.from({ length: 7 }, (_, i) => ({
                dataset: { day: i.toString() },
                classList: { add: () => {}, remove: () => {} },
                setAttribute: () => {},
                addEventListener: () => {}
            }));
        }
        if (selector === '.theme-icon') {
            return [{ textContent: '●', style: { transform: '' } }];
        }
        return [];
    };

    return () => {
        document.getElementById = originalGetElementById;
    };
}
