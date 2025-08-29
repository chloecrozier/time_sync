/**
 * Validation Tests
 * Tests for input validation and error handling
 */

describe('Validation Tests', () => {
    let timeSync;
    let cleanupDOM;

    function setupTest() {
        cleanupDOM = createMockDOM();
        timeSync = new TimeSync();
    }

    function teardownTest() {
        if (cleanupDOM) cleanupDOM();
    }

    it('should reject empty poll title', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = '';
        timeSync.selectedDays.add(1);
        
        // Mock showToast to capture the message
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Please enter a poll title');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject poll title over 100 characters', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = 'a'.repeat(101);
        timeSync.selectedDays.add(1);
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Poll title must be 100 characters or less');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject poll with no days selected in general mode', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = 'Valid Title';
        // Don't select any days
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Please select at least one day');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject poll with no dates selected in date mode', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = 'Valid Title';
        timeSync.switchToSpecificDates();
        // Don't set any dates
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Please select a date range');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject invalid time range (end before start)', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = 'Valid Title';
        document.getElementById('startTime').value = '17:00';
        document.getElementById('endTime').value = '09:00';
        timeSync.selectedDays.add(1);
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('End time must be after start time');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject time range less than 30 minutes', () => {
        setupTest();
        
        document.getElementById('pollTitle').value = 'Valid Title';
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '10:15';
        timeSync.selectedDays.add(1);
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Time range must be at least 30 minutes');
        expect(timeSync.currentPoll).toBe(null);
        
        teardownTest();
    });

    it('should reject empty user name', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test' };
        document.getElementById('userName').value = '';
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.addUser();
        
        expect(toastMessage).toBe('Please enter your name');
        expect(timeSync.currentUser).toBe(null);
        
        teardownTest();
    });

    it('should reject user name over 50 characters', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test' };
        document.getElementById('userName').value = 'a'.repeat(51);
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.addUser();
        
        expect(toastMessage).toBe('Name must be 50 characters or less');
        expect(timeSync.currentUser).toBe(null);
        
        teardownTest();
    });

    it('should validate date range is not more than 7 days', () => {
        setupTest();
        
        timeSync.switchToSpecificDates();
        
        // Mock date inputs
        document.getElementById('startDate').value = '2024-01-01';
        document.getElementById('endDate').value = '2024-01-10'; // 9 days
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.updateDateRange();
        
        expect(toastMessage).toBe('Date range cannot exceed 7 days');
        
        teardownTest();
    });

    it('should validate end date is not before start date', () => {
        setupTest();
        
        timeSync.switchToSpecificDates();
        
        // Mock date inputs
        document.getElementById('startDate').value = '2024-01-05';
        document.getElementById('endDate').value = '2024-01-03';
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.updateDateRange();
        
        expect(toastMessage).toBe('End date must be after start date');
        
        teardownTest();
    });

    it('should validate start date is not in the past', () => {
        setupTest();
        
        timeSync.switchToSpecificDates();
        
        // Mock date inputs with past date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        document.getElementById('startDate').value = yesterday.toISOString().split('T')[0];
        document.getElementById('endDate').value = new Date().toISOString().split('T')[0];
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.updateDateRange();
        
        expect(toastMessage).toBe('Start date cannot be in the past');
        
        teardownTest();
    });

    it('should handle invalid poll data structure when loading', () => {
        setupTest();
        
        // Mock localStorage with invalid data
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => JSON.stringify({ invalid: 'data' });
        
        const result = timeSync.loadPollFromStorage('test123');
        
        expect(result).toBe(false);
        
        // Restore localStorage
        localStorage.getItem = originalGetItem;
        
        teardownTest();
    });

    it('should handle JSON parse errors when loading poll data', () => {
        setupTest();
        
        // Mock localStorage with invalid JSON
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => 'invalid json{';
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        const result = timeSync.loadPollFromStorage('test123');
        
        expect(result).toBe(false);
        expect(toastMessage).toBe('Error loading poll data');
        
        // Restore localStorage
        localStorage.getItem = originalGetItem;
        
        teardownTest();
    });

    it('should handle localStorage quota exceeded error', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test123', title: 'Test' };
        
        // Mock localStorage to throw quota exceeded error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
        };
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.savePollToStorage();
        
        expect(toastMessage).toBe('Warning: Could not save data locally');
        
        // Restore localStorage
        localStorage.setItem = originalSetItem;
        
        teardownTest();
    });

    it('should validate availability toggle requires current user', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test' };
        timeSync.currentUser = null; // No user selected
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        // Try to toggle availability without user
        timeSync.toggleAvailability(1, '10:00');
        
        // Should not create availability entry
        expect(timeSync.allAvailability).toEqual({});
        
        teardownTest();
    });

    it('should handle clipboard API failures gracefully', () => {
        setupTest();
        
        // Mock navigator.clipboard to fail
        const originalClipboard = navigator.clipboard;
        navigator.clipboard = {
            writeText: () => Promise.reject(new Error('Clipboard failed'))
        };
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.copyUrlToClipboard('http://test.com');
        
        // Should fall back to alternative method
        expect(toastMessage).toBeTruthy();
        
        // Restore clipboard
        navigator.clipboard = originalClipboard;
        
        teardownTest();
    });
});
