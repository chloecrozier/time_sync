/**
 * Core Functionality Tests
 * Tests for the main TimeSync class functionality
 */

describe('Core Functionality', () => {
    let timeSync;
    let cleanupDOM;

    // Setup before each test
    function setupTest() {
        cleanupDOM = createMockDOM();
        timeSync = new TimeSync();
    }

    // Cleanup after each test
    function teardownTest() {
        if (cleanupDOM) cleanupDOM();
    }

    it('should initialize with default values', () => {
        setupTest();
        
        expect(timeSync.selectedDays).toEqual(new Set());
        expect(timeSync.selectedDates).toEqual([]);
        expect(timeSync.isDateMode).toBe(false);
        expect(timeSync.currentPoll).toBe(null);
        expect(timeSync.currentUser).toBe(null);
        
        teardownTest();
    });

    it('should format time correctly in 12-hour format', () => {
        setupTest();
        
        expect(timeSync.formatTime12Hour(0, 0)).toBe('12:00 AM');
        expect(timeSync.formatTime12Hour(12, 0)).toBe('12:00 PM');
        expect(timeSync.formatTime12Hour(13, 30)).toBe('1:30 PM');
        expect(timeSync.formatTime12Hour(23, 45)).toBe('11:45 PM');
        
        teardownTest();
    });

    it('should convert time to minutes correctly', () => {
        setupTest();
        
        expect(timeSync.timeToMinutes('00:00')).toBe(0);
        expect(timeSync.timeToMinutes('01:30')).toBe(90);
        expect(timeSync.timeToMinutes('12:00')).toBe(720);
        expect(timeSync.timeToMinutes('23:59')).toBe(1439);
        
        teardownTest();
    });

    it('should generate unique poll IDs', () => {
        setupTest();
        
        const id1 = timeSync.generateId();
        const id2 = timeSync.generateId();
        
        expect(id1).not.toBe(id2);
        expect(id1.length).toBeGreaterThan(5);
        expect(id2.length).toBeGreaterThan(5);
        
        teardownTest();
    });

    it('should generate time slots correctly', () => {
        setupTest();
        
        // Mock a poll with 9 AM to 5 PM
        timeSync.currentPoll = {
            startTime: '09:00',
            endTime: '17:00'
        };
        
        const slots = timeSync.generateTimeSlots();
        
        expect(slots[0]).toBe('09:00');
        expect(slots[slots.length - 1]).toBe('16:45');
        expect(slots.length).toBe(32); // 8 hours * 4 slots per hour
        
        teardownTest();
    });

    it('should switch between general days and specific dates mode', () => {
        setupTest();
        
        // Start in general days mode
        expect(timeSync.isDateMode).toBe(false);
        
        // Switch to specific dates
        timeSync.switchToSpecificDates();
        expect(timeSync.isDateMode).toBe(true);
        
        // Switch back to general days
        timeSync.switchToGeneralDays();
        expect(timeSync.isDateMode).toBe(false);
        
        teardownTest();
    });

    it('should create poll with general days', () => {
        setupTest();
        
        // Mock form values
        document.getElementById('pollTitle').value = 'Test Meeting';
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '12:00';
        
        // Select some days
        timeSync.selectedDays.add(1); // Monday
        timeSync.selectedDays.add(3); // Wednesday
        
        timeSync.createPoll();
        
        expect(timeSync.currentPoll).not.toBe(null);
        expect(timeSync.currentPoll.title).toBe('Test Meeting');
        expect(timeSync.currentPoll.isDateMode).toBe(false);
        expect(timeSync.currentPoll.days).toEqual([1, 3]);
        
        teardownTest();
    });

    it('should create poll with specific dates', () => {
        setupTest();
        
        // Mock form values
        document.getElementById('pollTitle').value = 'Conference Planning';
        document.getElementById('startTime').value = '09:00';
        document.getElementById('endTime').value = '18:00';
        
        // Switch to date mode and set dates
        timeSync.switchToSpecificDates();
        timeSync.selectedDates = [
            new Date('2024-01-15'),
            new Date('2024-01-16'),
            new Date('2024-01-17')
        ];
        
        timeSync.createPoll();
        
        expect(timeSync.currentPoll).not.toBe(null);
        expect(timeSync.currentPoll.title).toBe('Conference Planning');
        expect(timeSync.currentPoll.isDateMode).toBe(true);
        expect(timeSync.currentPoll.dates.length).toBe(3);
        
        teardownTest();
    });

    it('should add user and initialize availability', () => {
        setupTest();
        
        // Create a mock poll first
        timeSync.currentPoll = {
            id: 'test123',
            title: 'Test Poll',
            isDateMode: false,
            days: [1, 2, 3],
            startTime: '09:00',
            endTime: '17:00'
        };
        
        document.getElementById('userName').value = 'John Doe';
        
        timeSync.addUser();
        
        expect(timeSync.currentUser).toBe('John Doe');
        expect(timeSync.allAvailability['John Doe']).toEqual({});
        
        teardownTest();
    });

    it('should toggle availability correctly', () => {
        setupTest();
        
        // Setup poll and user
        timeSync.currentPoll = { id: 'test123' };
        timeSync.currentUser = 'Test User';
        timeSync.allAvailability = { 'Test User': {} };
        
        // Toggle availability on
        timeSync.toggleAvailability(1, '10:00');
        expect(timeSync.allAvailability['Test User']['1-10:00']).toBe(true);
        
        // Toggle availability off
        timeSync.toggleAvailability(1, '10:00');
        expect(timeSync.allAvailability['Test User']['1-10:00']).toBe(undefined);
        
        teardownTest();
    });

    it('should generate user icons consistently', () => {
        setupTest();
        
        const icon1 = timeSync.getUserIcon('John');
        const icon2 = timeSync.getUserIcon('John');
        const icon3 = timeSync.getUserIcon('Jane');
        
        expect(icon1).toBe(icon2); // Same user should get same icon
        expect(icon1).not.toBe(icon3); // Different users should get different icons (usually)
        
        teardownTest();
    });

    it('should save and load poll data', () => {
        setupTest();
        
        // Create a poll
        timeSync.currentPoll = {
            id: 'test123',
            title: 'Test Poll',
            isDateMode: false,
            days: [1, 2, 3],
            startTime: '09:00',
            endTime: '17:00'
        };
        timeSync.allAvailability = { 'User1': { '1-10:00': true } };
        
        // Save to storage
        timeSync.savePollToStorage();
        
        // Load from storage
        const loaded = timeSync.loadPollFromStorage('test123');
        
        expect(loaded).toBe(true);
        expect(timeSync.currentPoll.title).toBe('Test Poll');
        expect(timeSync.allAvailability['User1']['1-10:00']).toBe(true);
        
        teardownTest();
    });

    it('should reset app state correctly', () => {
        setupTest();
        
        // Set up some state
        timeSync.selectedDays.add(1);
        timeSync.selectedDates = [new Date()];
        timeSync.currentPoll = { id: 'test' };
        timeSync.currentUser = 'Test User';
        timeSync.allAvailability = { 'Test User': {} };
        
        // Mock confirm to return true
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        
        timeSync.resetApp();
        
        expect(timeSync.selectedDays.size).toBe(0);
        expect(timeSync.selectedDates.length).toBe(0);
        expect(timeSync.currentPoll).toBe(null);
        expect(timeSync.currentUser).toBe(null);
        expect(Object.keys(timeSync.allAvailability).length).toBe(0);
        
        // Restore confirm
        window.confirm = originalConfirm;
        
        teardownTest();
    });

    it('should handle theme switching', () => {
        setupTest();
        
        // Mock document.documentElement
        const mockElement = {
            getAttribute: () => 'light',
            setAttribute: () => {}
        };
        const originalDocumentElement = document.documentElement;
        document.documentElement = mockElement;
        
        // Mock localStorage
        const mockStorage = {};
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => { mockStorage[key] = value; };
        
        timeSync.setTheme('dark');
        
        expect(mockStorage['timesync-theme']).toBe('dark');
        
        // Restore mocks
        document.documentElement = originalDocumentElement;
        localStorage.setItem = originalSetItem;
        
        teardownTest();
    });

    it('should generate share message correctly', () => {
        setupTest();
        
        timeSync.currentPoll = {
            title: 'Team Meeting',
            isDateMode: false,
            days: [1, 3], // Monday, Wednesday
            startTime: '10:00',
            endTime: '12:00'
        };
        
        // Mock clipboard
        let copiedText = '';
        timeSync.copyToClipboard = (text, message) => { copiedText = text; };
        
        timeSync.copyShareMessage();
        
        expect(copiedText).toContain('Team Meeting');
        expect(copiedText).toContain('Monday, Wednesday');
        expect(copiedText).toContain('10:00 AM');
        expect(copiedText).toContain('12:00 PM');
        expect(copiedText).toContain('TimeSync');
        
        teardownTest();
    });

    it('should generate ICS file content correctly', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test123',
            title: 'Test Meeting',
            isDateMode: true,
            dates: ['2024-01-15'],
            startTime: '14:00',
            endTime: '15:00'
        };
        
        const icsContent = timeSync.generateICSFile();
        
        expect(icsContent).toContain('BEGIN:VCALENDAR');
        expect(icsContent).toContain('END:VCALENDAR');
        expect(icsContent).toContain('Test Meeting');
        expect(icsContent).toContain('BEGIN:VEVENT');
        expect(icsContent).toContain('END:VEVENT');
        
        teardownTest();
    });

    it('should parse time strings correctly', () => {
        setupTest();
        
        expect(timeSync.parseTime('09:30')).toEqual([9, 30]);
        expect(timeSync.parseTime('14:45')).toEqual([14, 45]);
        expect(timeSync.parseTime('00:00')).toEqual([0, 0]);
        
        teardownTest();
    });

    it('should get day names correctly', () => {
        setupTest();
        
        expect(timeSync.getDayNames([0, 1, 2])).toEqual(['Sunday', 'Monday', 'Tuesday']);
        expect(timeSync.getDayNames([5, 6])).toEqual(['Friday', 'Saturday']);
        
        teardownTest();
    });

    it('should combine date and time correctly', () => {
        setupTest();
        
        const date = new Date('2024-01-15');
        const combined = timeSync.combineDateAndTime(date, '14:30');
        
        expect(combined.getFullYear()).toBe(2024);
        expect(combined.getMonth()).toBe(0); // January
        expect(combined.getDate()).toBe(15);
        expect(combined.getHours()).toBe(14);
        expect(combined.getMinutes()).toBe(30);
        
        teardownTest();
    });

    it('should format datetime for ICS correctly', () => {
        setupTest();
        
        const date = new Date('2024-01-15T14:30:00.000Z');
        const formatted = timeSync.formatDateTimeForICS(date);
        
        expect(formatted).toBe('20240115T143000Z');
        
        teardownTest();
    });

    it('should escape ICS text correctly', () => {
        setupTest();
        
        expect(timeSync.escapeICSText('Hello, World;')).toBe('Hello\\, World\\;');
        expect(timeSync.escapeICSText('Line 1\nLine 2')).toBe('Line 1\\nLine 2');
        expect(timeSync.escapeICSText('Back\\slash')).toBe('Back\\\\slash');
        
        teardownTest();
    });
});
