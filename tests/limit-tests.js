/**
 * Limit Tests
 * Tests for system limitations and constraints
 */

describe('Limit Tests', () => {
    let timeSync;
    let cleanupDOM;

    function setupTest() {
        cleanupDOM = createMockDOM();
        timeSync = new TimeSync();
    }

    function teardownTest() {
        if (cleanupDOM) cleanupDOM();
    }

    it('should handle maximum number of participants (100)', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test' };
        
        // Add 100 users
        for (let i = 1; i <= 100; i++) {
            timeSync.allAvailability[`User${i}`] = { '1-10:00': true };
        }
        
        // Should handle 100 users without issues
        const suggestions = timeSync.calculateBestTimes();
        expect(suggestions).not.toBe(null);
        
        // Test with 101 users (over limit)
        timeSync.allAvailability['User101'] = { '1-10:00': true };
        
        // Should still work but may have performance implications
        const suggestionsOverLimit = timeSync.calculateBestTimes();
        expect(suggestionsOverLimit).not.toBe(null);
        
        teardownTest();
    });

    it('should handle maximum time slots (96 per day)', () => {
        setupTest();
        
        // Create poll with maximum time range (24 hours)
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: false,
            days: [1],
            startTime: '00:00',
            endTime: '23:59'
        };
        
        const timeSlots = timeSync.generateTimeSlots();
        
        // Should generate 96 slots (24 hours * 4 slots per hour)
        expect(timeSlots.length).toBe(96);
        expect(timeSlots[0]).toBe('00:00');
        expect(timeSlots[timeSlots.length - 1]).toBe('23:45');
        
        teardownTest();
    });

    it('should handle maximum date range (7 days)', () => {
        setupTest();
        
        timeSync.switchToSpecificDates();
        
        // Set exactly 7 days
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-07');
        
        timeSync.selectedDates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            timeSync.selectedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        expect(timeSync.selectedDates.length).toBe(7);
        
        // Create poll with 7 days
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: true,
            dates: timeSync.selectedDates.map(d => d.toISOString().split('T')[0]),
            startTime: '09:00',
            endTime: '17:00'
        };
        
        // Should handle 7 days without issues
        const suggestions = timeSync.calculateBestTimes();
        expect(suggestions).not.toBe(null);
        
        teardownTest();
    });

    it('should handle maximum availability selections per user', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: false,
            days: [1, 2, 3, 4, 5, 6, 0], // All 7 days
            startTime: '00:00',
            endTime: '23:59'
        };
        
        timeSync.currentUser = 'TestUser';
        timeSync.allAvailability = { 'TestUser': {} };
        
        // Select maximum possible slots (7 days * 96 slots = 672 slots)
        const timeSlots = timeSync.generateTimeSlots();
        timeSync.currentPoll.days.forEach(day => {
            timeSlots.forEach(time => {
                const key = `${day}-${time}`;
                timeSync.allAvailability['TestUser'][key] = true;
            });
        });
        
        const totalSelections = Object.keys(timeSync.allAvailability['TestUser']).length;
        expect(totalSelections).toBe(672); // 7 days * 96 slots
        
        // Should still calculate suggestions efficiently
        const suggestions = timeSync.calculateBestTimes();
        expect(suggestions).not.toBe(null);
        
        teardownTest();
    });

    it('should handle maximum poll title length (100 characters)', () => {
        setupTest();
        
        const maxTitle = 'a'.repeat(100);
        document.getElementById('pollTitle').value = maxTitle;
        document.getElementById('startTime').value = '09:00';
        document.getElementById('endTime').value = '17:00';
        timeSync.selectedDays.add(1);
        
        timeSync.createPoll();
        
        expect(timeSync.currentPoll).not.toBe(null);
        expect(timeSync.currentPoll.title).toBe(maxTitle);
        expect(timeSync.currentPoll.title.length).toBe(100);
        
        teardownTest();
    });

    it('should handle maximum user name length (50 characters)', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test' };
        const maxName = 'a'.repeat(50);
        document.getElementById('userName').value = maxName;
        
        timeSync.addUser();
        
        expect(timeSync.currentUser).toBe(maxName);
        expect(timeSync.currentUser.length).toBe(50);
        
        teardownTest();
    });

    it('should handle localStorage size limits', () => {
        setupTest();
        
        timeSync.currentPoll = { id: 'test', title: 'Test' };
        
        // Create large availability data
        const largeData = {};
        for (let i = 1; i <= 1000; i++) {
            largeData[`User${i}`] = {};
            for (let j = 0; j < 100; j++) {
                largeData[`User${i}`][`${j % 7}-${j}:00`] = true;
            }
        }
        timeSync.allAvailability = largeData;
        
        // Should handle large data sets
        let errorOccurred = false;
        try {
            timeSync.savePollToStorage();
        } catch (error) {
            errorOccurred = true;
        }
        
        // Should either save successfully or handle the error gracefully
        expect(errorOccurred).toBe(false);
        
        teardownTest();
    });

    it('should handle maximum number of suggestions (3 each)', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: false,
            days: [1, 2, 3, 4, 5], // 5 days
            startTime: '09:00',
            endTime: '17:00'
        };
        
        // Create availability data for multiple users and times
        timeSync.allAvailability = {
            'User1': { '1-10:00': true, '2-11:00': true, '3-12:00': true, '4-13:00': true, '5-14:00': true },
            'User2': { '1-10:00': true, '2-11:00': true, '3-12:00': true, '4-13:00': true },
            'User3': { '1-10:00': true, '2-11:00': true, '3-12:00': true }
        };
        
        const suggestions = timeSync.calculateBestTimes();
        
        expect(suggestions).not.toBe(null);
        expect(suggestions.bestSingle.length).toBeLessThan(4); // Max 3 suggestions
        expect(suggestions.longestBlock.length).toBeLessThan(4); // Max 3 suggestions
        
        teardownTest();
    });

    it('should handle minimum time slot duration (15 minutes)', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test',
            startTime: '10:00',
            endTime: '10:15' // Exactly 15 minutes
        };
        
        const timeSlots = timeSync.generateTimeSlots();
        
        expect(timeSlots.length).toBe(1);
        expect(timeSlots[0]).toBe('10:00');
        
        teardownTest();
    });

    it('should handle performance with large datasets', () => {
        setupTest();
        
        const startTime = Date.now();
        
        // Create large poll with many participants
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: false,
            days: [1, 2, 3, 4, 5, 6, 0], // All days
            startTime: '08:00',
            endTime: '18:00'
        };
        
        // Add 50 users with random availability
        for (let i = 1; i <= 50; i++) {
            timeSync.allAvailability[`User${i}`] = {};
            const timeSlots = timeSync.generateTimeSlots();
            timeSync.currentPoll.days.forEach(day => {
                timeSlots.forEach(time => {
                    if (Math.random() > 0.5) { // Random 50% availability
                        timeSync.allAvailability[`User${i}`][`${day}-${time}`] = true;
                    }
                });
            });
        }
        
        // Calculate suggestions and measure time
        const suggestions = timeSync.calculateBestTimes();
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        expect(suggestions).not.toBe(null);
        expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
        
        teardownTest();
    });

    it('should handle edge case of single time slot', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test',
            isDateMode: false,
            days: [1], // Single day
            startTime: '12:00',
            endTime: '12:15' // Single 15-minute slot
        };
        
        timeSync.allAvailability = {
            'User1': { '1-12:00': true },
            'User2': { '1-12:00': true }
        };
        
        const suggestions = timeSync.calculateBestTimes();
        
        expect(suggestions).not.toBe(null);
        expect(suggestions.bestSingle.length).toBe(1);
        expect(suggestions.longestBlock.length).toBe(0); // No consecutive blocks possible
        
        teardownTest();
    });
});
