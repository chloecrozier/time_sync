/**
 * UI Tests
 * Tests for user interface functionality and interactions
 */

describe('UI Tests', () => {
    let timeSync;
    let cleanupDOM;

    function setupTest() {
        cleanupDOM = createMockDOM();
        timeSync = new TimeSync();
    }

    function teardownTest() {
        if (cleanupDOM) cleanupDOM();
    }

    it('should render days header correctly for general days', () => {
        setupTest();
        
        timeSync.currentPoll = {
            isDateMode: false,
            days: [1, 2, 3] // Mon, Tue, Wed
        };
        
        // Mock the days header element
        let headerContent = '';
        const mockDaysHeader = {
            innerHTML: '',
            style: { gridTemplateColumns: '' },
            appendChild: (element) => {
                headerContent += element.textContent;
            }
        };
        document.getElementById = (id) => {
            if (id === 'daysHeader') return mockDaysHeader;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.renderDaysHeader();
        
        expect(mockDaysHeader.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
        expect(headerContent).toContain('Mon');
        expect(headerContent).toContain('Tue');
        expect(headerContent).toContain('Wed');
        
        teardownTest();
    });

    it('should render days header correctly for specific dates', () => {
        setupTest();
        
        timeSync.currentPoll = {
            isDateMode: true,
            dates: ['2024-01-15', '2024-01-16'] // Mon, Tue
        };
        
        // Mock the days header element
        let headerHTML = '';
        const mockDaysHeader = {
            innerHTML: '',
            style: { gridTemplateColumns: '' },
            appendChild: (element) => {
                headerHTML += element.innerHTML;
            }
        };
        document.getElementById = (id) => {
            if (id === 'daysHeader') return mockDaysHeader;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.renderDaysHeader();
        
        expect(mockDaysHeader.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
        expect(headerHTML).toContain('Mon');
        expect(headerHTML).toContain('Jan');
        
        teardownTest();
    });

    it('should update selected dates display correctly', () => {
        setupTest();
        
        timeSync.selectedDates = [
            new Date('2024-01-15'),
            new Date('2024-01-16'),
            new Date('2024-01-17')
        ];
        
        // Mock the selected dates container
        let containerHTML = '';
        const mockContainer = {
            innerHTML: '',
            appendChild: (element) => {
                containerHTML += element.textContent;
            }
        };
        document.getElementById = (id) => {
            if (id === 'selectedDates') return mockContainer;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.updateSelectedDatesDisplay();
        
        expect(containerHTML).toContain('Mon');
        expect(containerHTML).toContain('Tue');
        expect(containerHTML).toContain('Wed');
        expect(containerHTML).toContain('Jan');
        
        teardownTest();
    });

    it('should render participants list correctly', () => {
        setupTest();
        
        timeSync.allAvailability = {
            'John Doe': { '1-10:00': true },
            'Jane Smith': { '2-11:00': true },
            'Bob Johnson': { '3-12:00': true }
        };
        
        // Mock the participants list
        let participantCount = 0;
        const mockParticipantsList = {
            innerHTML: '',
            appendChild: (element) => {
                participantCount++;
                expect(element.className).toBe('participant-tag');
            }
        };
        document.getElementById = (id) => {
            if (id === 'participantsList') return mockParticipantsList;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.renderParticipants();
        
        expect(participantCount).toBe(3);
        
        teardownTest();
    });

    it('should render suggestions correctly', () => {
        setupTest();
        
        const mockSuggestions = {
            bestSingle: [
                { day: 'Monday', time: '10:00 AM', availableCount: 3, percentage: 75, users: ['A', 'B', 'C'] },
                { day: 'Tuesday', time: '2:00 PM', availableCount: 2, percentage: 50, users: ['A', 'B'] }
            ],
            longestBlock: [
                { day: 'Wednesday', startTime: '9:00 AM', endTime: '11:00 AM', duration: 120, minParticipants: 2 }
            ]
        };
        
        // Mock the suggestions list
        let suggestionCount = 0;
        const mockSuggestionsList = {
            innerHTML: '',
            appendChild: (element) => {
                suggestionCount++;
            }
        };
        document.getElementById = (id) => {
            if (id === 'suggestionsList') return mockSuggestionsList;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.renderSuggestions(mockSuggestions);
        
        expect(suggestionCount).toBe(2); // One container for each type
        
        teardownTest();
    });

    it('should handle empty suggestions correctly', () => {
        setupTest();
        
        // Mock the suggestions list
        let innerHTML = '';
        const mockSuggestionsList = {
            innerHTML: '',
            set innerHTML(value) { innerHTML = value; }
        };
        document.getElementById = (id) => {
            if (id === 'suggestionsList') return mockSuggestionsList;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.renderSuggestions(null);
        
        expect(innerHTML).toContain('まだ重複がありません');
        expect(innerHTML).toContain('No availability overlap found yet');
        
        teardownTest();
    });

    it('should update grid display with availability correctly', () => {
        setupTest();
        
        timeSync.currentPoll = {
            isDateMode: false,
            days: [1, 2]
        };
        timeSync.currentUser = 'TestUser';
        timeSync.allAvailability = {
            'TestUser': { '1-10:00': true },
            'OtherUser': { '2-11:00': true }
        };
        
        // Mock time slots
        const mockSlots = [
            {
                dataset: { day: '1', time: '10:00' },
                classList: { remove: () => {}, add: () => {} },
                style: { backgroundColor: '' },
                querySelector: () => ({ innerHTML: '', appendChild: () => {} })
            },
            {
                dataset: { day: '2', time: '11:00' },
                classList: { remove: () => {}, add: () => {} },
                style: { backgroundColor: '' },
                querySelector: () => ({ innerHTML: '', appendChild: () => {} })
            }
        ];
        
        document.querySelectorAll = (selector) => {
            if (selector === '.time-slot') return mockSlots;
            return [];
        };
        
        timeSync.updateGridDisplay();
        
        // Should set background color for available slots
        expect(mockSlots[0].style.backgroundColor).toBe('var(--accent-primary)');
        expect(mockSlots[1].style.backgroundColor).toBe('var(--bg-quaternary)');
        
        teardownTest();
    });

    it('should show toast messages correctly', () => {
        setupTest();
        
        // Mock toast element
        let toastText = '';
        let toastClass = '';
        let showCalled = false;
        const mockToast = {
            textContent: '',
            className: '',
            classList: {
                add: (cls) => { if (cls === 'show') showCalled = true; },
                remove: () => {}
            },
            set textContent(value) { toastText = value; },
            set className(value) { toastClass = value; }
        };
        
        document.getElementById = (id) => {
            if (id === 'toast') return mockToast;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.showToast('Test message', 1000, 'success');
        
        expect(toastText).toBe('Test message');
        expect(toastClass).toBe('toast success');
        expect(showCalled).toBe(true);
        
        teardownTest();
    });

    it('should handle drag functionality setup', () => {
        setupTest();
        
        timeSync.currentUser = 'TestUser';
        timeSync.allAvailability = { 'TestUser': {} };
        
        // Test drag start
        timeSync.startDrag(1, '10:00');
        
        expect(timeSync.isDragging).toBe(true);
        expect(timeSync.dragMode).toBeTruthy();
        
        // Test drag end
        timeSync.endDrag();
        
        expect(timeSync.isDragging).toBe(false);
        expect(timeSync.dragMode).toBe(null);
        
        teardownTest();
    });

    it('should handle timezone display correctly', () => {
        setupTest();
        
        timeSync.currentPoll = {
            creatorTimezone: 'America/New_York'
        };
        
        // Mock timezone element
        let timezoneText = '';
        const mockTimezone = {
            set textContent(value) { timezoneText = value; }
        };
        
        document.getElementById = (id) => {
            if (id === 'currentTimezone') return mockTimezone;
            if (id === 'pollTitleDisplay') return { textContent: '' };
            if (id === 'daysHeader') return { innerHTML: '', style: {} };
            if (id === 'availabilityGrid') return { innerHTML: '' };
            if (id === 'participantsList') return { innerHTML: '' };
            if (id === 'suggestionsSection') return { style: {} };
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.displayPoll();
        
        expect(timezoneText).toContain('Your timezone:');
        expect(timezoneText).toContain('Poll created in America/New_York');
        
        teardownTest();
    });

    it('should render user icons consistently', () => {
        setupTest();
        
        const icons = timeSync.renderUserIcons(['Alice', 'Bob', 'Charlie']);
        
        expect(icons).toBeTruthy();
        expect(icons.split(' ').length).toBe(3);
        
        // Same users should produce same icons
        const icons2 = timeSync.renderUserIcons(['Alice', 'Bob', 'Charlie']);
        expect(icons).toBe(icons2);
        
        teardownTest();
    });

    it('should handle form validation UI feedback', () => {
        setupTest();
        
        let focusCalled = false;
        document.getElementById = (id) => {
            if (id === 'pollTitle') {
                return {
                    value: '',
                    focus: () => { focusCalled = true; },
                    addEventListener: () => {}
                };
            }
            return { 
                value: '', 
                focus: () => {}, 
                addEventListener: () => {},
                style: {},
                innerHTML: '',
                textContent: ''
            };
        };
        
        timeSync.selectedDays.add(1);
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.createPoll();
        
        expect(toastMessage).toBe('Please enter a poll title');
        expect(focusCalled).toBe(true);
        
        teardownTest();
    });

    it('should toggle share menu correctly', () => {
        setupTest();
        
        // Mock share menu element
        let menuVisible = false;
        const mockShareMenu = {
            classList: {
                toggle: (className) => {
                    if (className === 'show') {
                        menuVisible = !menuVisible;
                    }
                },
                remove: (className) => {
                    if (className === 'show') {
                        menuVisible = false;
                    }
                }
            }
        };
        
        document.getElementById = (id) => {
            if (id === 'shareMenu') return mockShareMenu;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        // Test toggle
        timeSync.toggleShareMenu();
        expect(menuVisible).toBe(true);
        
        // Test hide
        timeSync.hideShareMenu();
        expect(menuVisible).toBe(false);
        
        teardownTest();
    });

    it('should show QR modal correctly', () => {
        setupTest();
        
        // Mock QR modal elements
        let modalVisible = false;
        let qrImageSrc = '';
        const mockModal = {
            style: {
                set display(value) { modalVisible = (value === 'flex'); }
            }
        };
        const mockQRContainer = {
            innerHTML: '',
            appendChild: (element) => {
                qrImageSrc = element.src;
            }
        };
        
        document.getElementById = (id) => {
            if (id === 'qrModal') return mockModal;
            if (id === 'qrCodeContainer') return mockQRContainer;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        // Mock window.location
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            value: { href: 'http://test.com/poll' },
            writable: true
        });
        
        timeSync.showQRCode();
        
        expect(modalVisible).toBe(true);
        expect(qrImageSrc).toContain('qrserver.com');
        expect(qrImageSrc).toContain('http://test.com/poll');
        
        // Restore location
        window.location = originalLocation;
        
        teardownTest();
    });

    it('should hide QR modal correctly', () => {
        setupTest();
        
        let modalVisible = true;
        const mockModal = {
            style: {
                set display(value) { modalVisible = (value === 'flex'); }
            }
        };
        
        document.getElementById = (id) => {
            if (id === 'qrModal') return mockModal;
            return { innerHTML: '', style: {}, textContent: '' };
        };
        
        timeSync.hideQRModal();
        
        expect(modalVisible).toBe(false);
        
        teardownTest();
    });

    it('should handle calendar export UI correctly', () => {
        setupTest();
        
        timeSync.currentPoll = {
            id: 'test123',
            title: 'Test Meeting',
            isDateMode: false,
            days: [1],
            startTime: '10:00',
            endTime: '11:00'
        };
        
        // Mock document.createElement and URL.createObjectURL
        let blobCreated = false;
        let linkClicked = false;
        const originalCreateElement = document.createElement;
        const originalCreateObjectURL = window.URL.createObjectURL;
        const originalRevokeObjectURL = window.URL.revokeObjectURL;
        
        document.createElement = (tagName) => {
            if (tagName === 'a') {
                return {
                    href: '',
                    download: '',
                    click: () => { linkClicked = true; }
                };
            }
            return originalCreateElement.call(document, tagName);
        };
        
        window.URL.createObjectURL = (blob) => {
            blobCreated = true;
            return 'blob:test-url';
        };
        
        window.URL.revokeObjectURL = () => {};
        
        // Mock document.body
        document.body = {
            appendChild: () => {},
            removeChild: () => {}
        };
        
        let toastMessage = '';
        timeSync.showToast = (message) => { toastMessage = message; };
        
        timeSync.exportToCalendar();
        
        expect(blobCreated).toBe(true);
        expect(linkClicked).toBe(true);
        expect(toastMessage).toBe('Calendar file downloaded');
        
        // Restore mocks
        document.createElement = originalCreateElement;
        window.URL.createObjectURL = originalCreateObjectURL;
        window.URL.revokeObjectURL = originalRevokeObjectURL;
        
        teardownTest();
    });
});
