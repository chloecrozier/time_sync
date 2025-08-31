class TimeSync {
    constructor() {
        this.selectedDays = new Set();
        this.selectedDates = [];
        this.isDateMode = false;
        this.currentPoll = null;
        this.userAvailability = {};
        this.allAvailability = {};
        this.currentUser = null;
        this.isDragging = false;
        this.dragMode = null; // 'select' or 'deselect'
        
        this.initializeTimeOptions();
        this.bindEvents();
        this.initializeTheme();
        this.loadPollFromURL();
        this.setupKeyboardNavigation();
    }

    initializeTimeOptions() {
        const startSelect = document.getElementById('startTime');
        const endSelect = document.getElementById('endTime');
        
        // Generate time options in 15-minute increments
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const time12 = this.formatTime12Hour(hour, minute);
                
                const option1 = new Option(time12, time24);
                const option2 = new Option(time12, time24);
                
                startSelect.appendChild(option1);
                endSelect.appendChild(option2);
            }
        }
        
        // Set default values
        startSelect.value = '09:00';
        endSelect.value = '17:00';
    }

    formatTime12Hour(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.currentUser = null;
                this.updateGridDisplay();
                this.showToast('Deselected current user');
            }
        });
    }

    bindEvents() {
        // Schedule type toggle
        document.getElementById('generalDaysBtn').addEventListener('click', () => {
            this.switchToGeneralDays();
            this.checkAutoCreatePoll();
        });

        document.getElementById('specificDatesBtn').addEventListener('click', () => {
            this.switchToSpecificDates();
            this.checkAutoCreatePoll();
        });

        // Day selection
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.target.dataset.day);
                if (this.selectedDays.has(day)) {
                    this.selectedDays.delete(day);
                    e.target.classList.remove('selected');
                    e.target.setAttribute('aria-pressed', 'false');
                } else {
                    this.selectedDays.add(day);
                    e.target.classList.add('selected');
                    e.target.setAttribute('aria-pressed', 'true');
                }
                this.checkAutoCreatePoll();
            });
        });

        // Date range selection
        document.getElementById('startDate').addEventListener('change', () => {
            this.updateDateRange();
            this.checkAutoCreatePoll();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.updateDateRange();
            this.checkAutoCreatePoll();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Auto-create poll when all fields are complete
        document.getElementById('pollTitle').addEventListener('input', () => {
            this.checkAutoCreatePoll();
        });

        document.getElementById('startTime').addEventListener('change', () => {
            this.checkAutoCreatePoll();
        });

        document.getElementById('endTime').addEventListener('change', () => {
            this.checkAutoCreatePoll();
        });



        // Add user
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.addUser();
        });

        // Share poll - toggle dropdown
        document.getElementById('shareBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleShareMenu();
        });

        // Share menu options
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            this.copyUrlToClipboard(window.location.href);
            this.hideShareMenu();
        });

        document.getElementById('showQRBtn').addEventListener('click', () => {
            this.showQRCode();
            this.hideShareMenu();
        });

        document.getElementById('shareTextBtn').addEventListener('click', () => {
            this.copyShareMessage();
            this.hideShareMenu();
        });

        document.getElementById('exportIcsBtn').addEventListener('click', () => {
            this.exportToCalendar();
            this.hideShareMenu();
        });

        // QR Modal
        document.getElementById('closeQRModal').addEventListener('click', () => {
            this.hideQRModal();
        });

        document.getElementById('downloadQRBtn').addEventListener('click', () => {
            this.downloadQRCode();
        });

        // Copy calendar link
        document.getElementById('copyCalendarBtn').addEventListener('click', () => {
            this.copyCalendarLink();
        });

        // Close share menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.share-dropdown')) {
                this.hideShareMenu();
            }
        });

        // Close modal when clicking outside
        document.getElementById('qrModal').addEventListener('click', (e) => {
            if (e.target.id === 'qrModal') {
                this.hideQRModal();
            }
        });

        // New poll
        document.getElementById('newPollBtn').addEventListener('click', () => {
            this.resetApp();
        });

        // Enter key for user name
        document.getElementById('userName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addUser();
            }
        });
    }

    switchToGeneralDays() {
        this.isDateMode = false;
        document.getElementById('generalDaysBtn').classList.add('active');
        document.getElementById('specificDatesBtn').classList.remove('active');
        document.getElementById('generalDaysGroup').style.display = 'block';
        document.getElementById('specificDatesGroup').style.display = 'none';
    }

    switchToSpecificDates() {
        this.isDateMode = true;
        document.getElementById('specificDatesBtn').classList.add('active');
        document.getElementById('generalDaysBtn').classList.remove('active');
        document.getElementById('specificDatesGroup').style.display = 'block';
        document.getElementById('generalDaysGroup').style.display = 'none';
        
        // Set default start date to today
        const today = new Date();
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        // Set minimum date to today to prevent past dates
        startDateInput.min = today.toISOString().split('T')[0];
        endDateInput.min = today.toISOString().split('T')[0];
        
        if (!startDateInput.value) {
            startDateInput.value = today.toISOString().split('T')[0];
        }
        
        if (!endDateInput.value) {
            // Set default end date to 6 days from today
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 6);
            endDateInput.value = endDate.toISOString().split('T')[0];
        }
        
        this.updateDateRange();
    }

    updateDateRange() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (!startDateInput.value || !endDateInput.value) {
            this.selectedDates = [];
            this.updateSelectedDatesDisplay();
            return;
        }

        const startDate = new Date(startDateInput.value + 'T00:00:00');
        const endDate = new Date(endDateInput.value + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Validate dates are not in the past
        if (startDate < today) {
            this.showToast('Start date cannot be in the past');
            startDateInput.value = today.toISOString().split('T')[0];
            return;
        }
        
        // Validate date range
        if (endDate < startDate) {
            this.showToast('End date must be after start date');
            endDateInput.value = startDateInput.value;
            return;
        }

        // Check if range is more than 7 days
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > 7) {
            this.showToast('Date range cannot exceed 7 days');
            const maxEndDate = new Date(startDate);
            maxEndDate.setDate(startDate.getDate() + 6);
            endDateInput.value = maxEndDate.toISOString().split('T')[0];
            return;
        }

        // Generate date array
        this.selectedDates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            this.selectedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        this.updateSelectedDatesDisplay();
    }

    updateSelectedDatesDisplay() {
        const container = document.getElementById('selectedDates');
        container.innerHTML = '';
        
        this.selectedDates.forEach(date => {
            const chip = document.createElement('div');
            chip.className = 'selected-date-chip';
            chip.textContent = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            container.appendChild(chip);
        });
    }

    checkAutoCreatePoll() {
        // Don't auto-create if poll already exists
        if (this.currentPoll) return;

        const title = document.getElementById('pollTitle').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        // Check if all required fields are complete
        let hasValidSelection = false;
        
        if (this.isDateMode) {
            hasValidSelection = this.selectedDates.length > 0;
        } else {
            hasValidSelection = this.selectedDays.size > 0;
        }

        // Auto-create if all fields are complete
        if (title && startTime && endTime && hasValidSelection) {
            this.createPoll();
        }
    }

    createPoll() {
        const title = document.getElementById('pollTitle').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        // Enhanced validation
        if (!title) {
            this.showToast('Please enter a poll title');
            document.getElementById('pollTitle').focus();
            return;
        }

        if (title.length > 100) {
            this.showToast('Poll title must be 100 characters or less');
            document.getElementById('pollTitle').focus();
            return;
        }

        // Validate selection based on mode
        if (this.isDateMode) {
            if (this.selectedDates.length === 0) {
                this.showToast('Please select a date range');
                document.getElementById('startDate').focus();
                return;
            }
        } else {
            if (this.selectedDays.size === 0) {
                this.showToast('Please select at least one day');
                return;
            }
        }

        if (startTime >= endTime) {
            this.showToast('End time must be after start time');
            document.getElementById('endTime').focus();
            return;
        }

        // Check for reasonable time range (at least 30 minutes)
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        if (endMinutes - startMinutes < 30) {
            this.showToast('Time range must be at least 30 minutes');
            return;
        }

        this.currentPoll = {
            id: this.generateId(),
            title,
            isDateMode: this.isDateMode,
            days: this.isDateMode ? [] : Array.from(this.selectedDays).sort(),
            dates: this.isDateMode ? this.selectedDates.map(d => d.toISOString().split('T')[0]) : [],
            startTime,
            endTime,
            createdAt: new Date().toISOString(),
            creatorTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        this.allAvailability = {};
        this.savePollToStorage();
        this.displayPoll();
        this.updateURL();
    }

    displayPoll() {
        document.getElementById('pollCreator').style.display = 'none';
        document.getElementById('pollDisplay').style.display = 'block';
        
        document.getElementById('pollTitleDisplay').textContent = this.currentPoll.title;
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const creatorTimezone = this.currentPoll.creatorTimezone || userTimezone;
        
        let timezoneText = `Your timezone: ${userTimezone}`;
        if (userTimezone !== creatorTimezone) {
            timezoneText += ` (Poll created in ${creatorTimezone})`;
        }
        document.getElementById('currentTimezone').textContent = timezoneText;

        this.renderDaysHeader();
        this.renderAvailabilityGrid();
        this.renderParticipants();
        this.updateSuggestions();
    }

    renderDaysHeader() {
        const daysHeader = document.getElementById('daysHeader');
        daysHeader.innerHTML = '';
        
        if (this.currentPoll.isDateMode) {
            // Show specific dates
            const dates = this.currentPoll.dates.map(dateStr => new Date(dateStr));
            daysHeader.style.gridTemplateColumns = `repeat(${dates.length}, 1fr)`;
            
            dates.forEach(date => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-header';
                dayHeader.innerHTML = `
                    <div style="font-size: 0.75em; line-height: 1.2;">
                        ${date.toLocaleDateString('en-US', { weekday: 'short' })}<br>
                        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                `;
                daysHeader.appendChild(dayHeader);
            });
        } else {
            // Show general days
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            daysHeader.style.gridTemplateColumns = `repeat(${this.currentPoll.days.length}, 1fr)`;
            
            this.currentPoll.days.forEach(dayIndex => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-header';
                dayHeader.textContent = dayNames[dayIndex];
                daysHeader.appendChild(dayHeader);
            });
        }
    }

    renderAvailabilityGrid() {
        const grid = document.getElementById('availabilityGrid');
        grid.innerHTML = '';

        const timeSlots = this.generateTimeSlots();
        
        timeSlots.forEach(time => {
            const timeRow = document.createElement('div');
            timeRow.className = 'time-row';
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = this.formatTimeForDisplay(time);
            
            const timeSlotsContainer = document.createElement('div');
            timeSlotsContainer.className = 'time-slots';
            
            if (this.currentPoll.isDateMode) {
                timeSlotsContainer.style.gridTemplateColumns = `repeat(${this.currentPoll.dates.length}, 1fr)`;
                
                this.currentPoll.dates.forEach((dateStr, index) => {
                    const slot = document.createElement('div');
                    slot.className = 'time-slot';
                    slot.dataset.day = `date-${index}`;
                    slot.dataset.date = dateStr;
                    slot.dataset.time = time;
                    
                    // Add drag functionality
                    slot.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        if (this.currentUser) {
                            this.startDrag(`date-${index}`, time);
                        } else {
                            this.showToast('Please enter your name first');
                        }
                    });
                    
                    slot.addEventListener('mouseenter', () => {
                        if (this.isDragging && this.currentUser) {
                            this.handleDrag(`date-${index}`, time);
                        }
                    });
                    
                    slot.addEventListener('click', () => {
                        if (this.currentUser) {
                            this.toggleAvailability(`date-${index}`, time);
                        } else {
                            this.showToast('Please enter your name first');
                        }
                    });
                    
                    const participantsDiv = document.createElement('div');
                    participantsDiv.className = 'time-slot-participants';
                    slot.appendChild(participantsDiv);
                    
                    timeSlotsContainer.appendChild(slot);
                });
            } else {
                timeSlotsContainer.style.gridTemplateColumns = `repeat(${this.currentPoll.days.length}, 1fr)`;
                
                this.currentPoll.days.forEach(dayIndex => {
                    const slot = document.createElement('div');
                    slot.className = 'time-slot';
                    slot.dataset.day = dayIndex;
                    slot.dataset.time = time;
                    
                    // Add drag functionality
                    slot.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        if (this.currentUser) {
                            this.startDrag(dayIndex, time);
                        } else {
                            this.showToast('Please enter your name first');
                        }
                    });
                    
                    slot.addEventListener('mouseenter', () => {
                        if (this.isDragging && this.currentUser) {
                            this.handleDrag(dayIndex, time);
                        }
                    });
                    
                    slot.addEventListener('click', () => {
                        if (this.currentUser) {
                            this.toggleAvailability(dayIndex, time);
                        } else {
                            this.showToast('Please enter your name first');
                        }
                    });
                    
                    const participantsDiv = document.createElement('div');
                    participantsDiv.className = 'time-slot-participants';
                    slot.appendChild(participantsDiv);
                    
                    timeSlotsContainer.appendChild(slot);
                });
            }
            
            timeRow.appendChild(timeLabel);
            timeRow.appendChild(timeSlotsContainer);
            grid.appendChild(timeRow);
        });

        this.updateGridDisplay();
    }

    generateTimeSlots() {
        const slots = [];
        const [startHour, startMinute] = this.currentPoll.startTime.split(':').map(Number);
        const [endHour, endMinute] = this.currentPoll.endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
            
            currentMinute += 15;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour++;
            }
        }
        
        return slots;
    }

    formatTimeForDisplay(time24) {
        const [hour, minute] = time24.split(':').map(Number);
        return this.formatTime12Hour(hour, minute);
    }

    addUser() {
        // First check if poll exists
        if (!this.currentPoll) {
            this.showToast('Please complete the poll setup first');
            return;
        }

        const nameInput = document.getElementById('userName');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showToast('Please enter your name');
            nameInput.focus();
            return;
        }

        if (name.length > 50) {
            this.showToast('Name must be 50 characters or less');
            nameInput.focus();
            return;
        }

        // Check for duplicate names
        if (this.allAvailability[name] && Object.keys(this.allAvailability[name]).length > 0) {
            if (!confirm(`User "${name}" already exists. Do you want to edit their availability?`)) {
                nameInput.focus();
                return;
            }
        }

        this.currentUser = name;
        this.userAvailability = {};
        
        // Initialize user's availability if not exists
        if (!this.allAvailability[name]) {
            this.allAvailability[name] = {};
        }
        
        nameInput.value = '';
        this.updateGridDisplay();
        this.renderParticipants();
        this.updateSuggestions();
        this.savePollToStorage();
        this.showToast(`Welcome, ${name}! Click and drag to mark your availability.`);
    }

    toggleAvailability(day, time) {
        if (!this.currentUser) return;
        
        const key = `${day}-${time}`;
        
        if (!this.allAvailability[this.currentUser]) {
            this.allAvailability[this.currentUser] = {};
        }
        
        if (this.allAvailability[this.currentUser][key]) {
            delete this.allAvailability[this.currentUser][key];
        } else {
            this.allAvailability[this.currentUser][key] = true;
        }
        
        this.updateGridDisplay();
        this.updateSuggestions();
        this.savePollToStorage();
    }

    startDrag(day, time) {
        this.isDragging = true;
        const key = `${day}-${time}`;
        const isCurrentlySelected = this.allAvailability[this.currentUser] && 
                                   this.allAvailability[this.currentUser][key];
        this.dragMode = isCurrentlySelected ? 'deselect' : 'select';
        this.toggleAvailability(day, time);
        
        // Add global mouse events
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('mouseleave', this.endDrag.bind(this));
    }

    handleDrag(day, time) {
        if (!this.isDragging || !this.currentUser) return;
        
        const key = `${day}-${time}`;
        const isCurrentlySelected = this.allAvailability[this.currentUser] && 
                                   this.allAvailability[this.currentUser][key];
        
        if (this.dragMode === 'select' && !isCurrentlySelected) {
            this.toggleAvailability(day, time);
        } else if (this.dragMode === 'deselect' && isCurrentlySelected) {
            this.toggleAvailability(day, time);
        }
    }

    endDrag() {
        this.isDragging = false;
        this.dragMode = null;
        document.removeEventListener('mouseup', this.endDrag.bind(this));
        document.removeEventListener('mouseleave', this.endDrag.bind(this));
    }

    updateGridDisplay() {
        document.querySelectorAll('.time-slot').forEach(slot => {
            const day = slot.dataset.day;
            const time = slot.dataset.time;
            const key = `${day}-${time}`;
            
            // Reset classes and styles
            slot.classList.remove('available');
            slot.style.backgroundColor = '';
            
            // Get all available users for this slot
            const availableUsers = Object.keys(this.allAvailability).filter(user => 
                this.allAvailability[user][key]
            );
            
            // Simple, clean styling based on availability
            if (availableUsers.length > 0) {
                // Check if current user is available for this slot
                const currentUserAvailable = this.currentUser && 
                    this.allAvailability[this.currentUser] && 
                    this.allAvailability[this.currentUser][key];
                
                if (currentUserAvailable) {
                    // Current user's slots - clean black fill
                    slot.style.backgroundColor = 'var(--accent-primary)';
                    slot.classList.add('available', 'current-user');
                } else {
                    // Other users' slots - subtle gray
                    slot.style.backgroundColor = 'var(--bg-quaternary)';
                    slot.classList.add('others-available');
                }
            }
            
            // Update participants display
            const participantsDiv = slot.querySelector('.time-slot-participants');
            participantsDiv.innerHTML = '';
            
            availableUsers.forEach(user => {
                const icon = document.createElement('span');
                icon.className = 'participant-icon';
                icon.title = user;
                icon.textContent = this.getUserIcon(user);
                participantsDiv.appendChild(icon);
            });
        });
    }

    getUserIcon(username) {
        // Simple Japanese-inspired icons for users
        const icons = ['○', '△', '□', '◇', '☆', '◐', '◑', '◒', '◓', '●', '▲', '■', '◆', '★', '◉'];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return icons[Math.abs(hash) % icons.length];
    }

    getUserColor(username) {
        // Subtle monochrome colors for consistency
        return 'var(--text-primary)';
    }

    renderParticipants() {
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';
        
        Object.keys(this.allAvailability).forEach(user => {
            const tag = document.createElement('div');
            tag.className = 'participant-tag';
            tag.innerHTML = `<span class="participant-tag-icon">${this.getUserIcon(user)}</span> ${user}`;
            participantsList.appendChild(tag);
        });
    }

    updateSuggestions() {
        const totalParticipants = Object.keys(this.allAvailability).length;
        
        if (totalParticipants < 2) {
            document.getElementById('suggestionsSection').style.display = 'none';
            return;
        }

        const suggestions = this.calculateBestTimes();
        this.renderSuggestions(suggestions);
        document.getElementById('suggestionsSection').style.display = 'block';
    }

    calculateBestTimes() {
        const timeSlots = this.generateTimeSlots();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const totalParticipants = Object.keys(this.allAvailability).length;
        
        // Calculate availability for each slot
        const slotAvailability = [];
        
        timeSlots.forEach(time => {
            if (this.currentPoll.isDateMode) {
                this.currentPoll.dates.forEach((dateStr, index) => {
                    const key = `date-${index}-${time}`;
                    const availableUsers = Object.keys(this.allAvailability).filter(user => 
                        this.allAvailability[user][key]
                    );
                    
                    if (availableUsers.length > 0) {
                        const date = new Date(dateStr);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        slotAvailability.push({
                            day: dayName,
                            time: this.formatTimeForDisplay(time),
                            timeKey: time,
                            dayIndex: `date-${index}`,
                            availableCount: availableUsers.length,
                            percentage: Math.round((availableUsers.length / totalParticipants) * 100),
                            users: availableUsers
                        });
                    }
                });
            } else {
                this.currentPoll.days.forEach(dayIndex => {
                    const key = `${dayIndex}-${time}`;
                    const availableUsers = Object.keys(this.allAvailability).filter(user => 
                        this.allAvailability[user][key]
                    );
                    
                    if (availableUsers.length > 0) {
                        slotAvailability.push({
                            day: dayNames[dayIndex],
                            time: this.formatTimeForDisplay(time),
                            timeKey: time,
                            dayIndex: dayIndex,
                            availableCount: availableUsers.length,
                            percentage: Math.round((availableUsers.length / totalParticipants) * 100),
                            users: availableUsers
                        });
                    }
                });
            }
        });

        if (slotAvailability.length === 0) {
            return null;
        }

        // Find top 3 best single time slots (highest percentage)
        const topSingleSlots = slotAvailability
            .sort((a, b) => {
                // Primary sort by percentage, secondary by number of people
                if (b.percentage !== a.percentage) {
                    return b.percentage - a.percentage;
                }
                return b.availableCount - a.availableCount;
            })
            .slice(0, 3);

        // Find top consecutive blocks with most participants
        const topBlocks = this.findTopConsecutiveBlocks(slotAvailability, timeSlots);

        return {
            bestSingle: topSingleSlots,
            longestBlock: topBlocks
        };
    }

    findTopConsecutiveBlocks(slotAvailability, timeSlots) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let allBlocks = [];

        // Group by day
        const dayGroups = {};
        slotAvailability.forEach(slot => {
            if (!dayGroups[slot.dayIndex]) {
                dayGroups[slot.dayIndex] = [];
            }
            dayGroups[slot.dayIndex].push(slot);
        });

        // For each day, find consecutive blocks
        Object.keys(dayGroups).forEach(dayIndex => {
            const daySlots = dayGroups[dayIndex];
            daySlots.sort((a, b) => timeSlots.indexOf(a.timeKey) - timeSlots.indexOf(b.timeKey));

            let currentBlock = [];
            let currentMinParticipants = Infinity;

            for (let i = 0; i < daySlots.length; i++) {
                const slot = daySlots[i];
                const currentTimeIndex = timeSlots.indexOf(slot.timeKey);
                
                if (currentBlock.length === 0) {
                    // Start new block
                    currentBlock = [slot];
                    currentMinParticipants = slot.availableCount;
                } else {
                    const lastTimeIndex = timeSlots.indexOf(currentBlock[currentBlock.length - 1].timeKey);
                    
                    if (currentTimeIndex === lastTimeIndex + 1 && slot.availableCount >= Math.floor(currentMinParticipants * 0.8)) {
                        // Continue block if consecutive and has at least 80% of the minimum participants
                        currentBlock.push(slot);
                        currentMinParticipants = Math.min(currentMinParticipants, slot.availableCount);
                    } else {
                        // End current block and evaluate
                        if (currentBlock.length >= 2) {
                            const score = currentBlock.length * currentMinParticipants;
                            allBlocks.push({
                                day: dayNames[dayIndex],
                                startTime: currentBlock[0].time,
                                endTime: currentBlock[currentBlock.length - 1].time,
                                duration: currentBlock.length * 15, // minutes
                                minParticipants: currentMinParticipants,
                                slots: currentBlock.length,
                                score: score
                            });
                        }
                        
                        // Start new block
                        currentBlock = [slot];
                        currentMinParticipants = slot.availableCount;
                    }
                }
            }

            // Check final block
            if (currentBlock.length >= 2) {
                const score = currentBlock.length * currentMinParticipants;
                allBlocks.push({
                    day: dayNames[dayIndex],
                    startTime: currentBlock[0].time,
                    endTime: currentBlock[currentBlock.length - 1].time,
                    duration: currentBlock.length * 15,
                    minParticipants: currentMinParticipants,
                    slots: currentBlock.length,
                    score: score
                });
            }
        });

        // Sort by score (duration * participants) and return top 3
        return allBlocks
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }

    renderSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        if (!suggestions || (!suggestions.bestSingle.length && !suggestions.longestBlock.length)) {
            suggestionsList.innerHTML = '<div class="suggestion-item">まだ重複がありません<br><span style="font-size: 0.8em; opacity: 0.7;">No availability overlap found yet</span></div>';
            return;
        }

        // Best single time slots - simplified
        if (suggestions.bestSingle && suggestions.bestSingle.length > 0) {
            const bestSlotsContainer = document.createElement('div');
            bestSlotsContainer.innerHTML = '<div class="suggestion-label">最適な時間 • Best Times</div>';
            
            suggestions.bestSingle.forEach((slot, index) => {
                const bestItem = document.createElement('div');
                bestItem.className = 'suggestion-item';
                const rank = index + 1;
                bestItem.innerHTML = `
                    <div class="suggestion-rank">${rank}</div>
                    <div class="suggestion-content">
                        <div class="suggestion-time">${slot.day} at ${slot.time}</div>
                        <div class="suggestion-users">${this.renderUserIcons(slot.users)} ${slot.availableCount} available</div>
                    </div>
                `;
                bestSlotsContainer.appendChild(bestItem);
            });
            
            suggestionsList.appendChild(bestSlotsContainer);
        }

        // Longest consecutive blocks - simplified
        if (suggestions.longestBlock && suggestions.longestBlock.length > 0) {
            const blocksContainer = document.createElement('div');
            blocksContainer.innerHTML = '<div class="suggestion-label">時間ブロック • Time Blocks</div>';
            blocksContainer.style.marginTop = '24px';
            
            suggestions.longestBlock.forEach((block, index) => {
                const blockItem = document.createElement('div');
                blockItem.className = 'suggestion-item';
                const hours = Math.floor(block.duration / 60);
                const minutes = block.duration % 60;
                const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                const rank = index + 1;
                
                blockItem.innerHTML = `
                    <div class="suggestion-rank">${rank}</div>
                    <div class="suggestion-content">
                        <div class="suggestion-time">${block.day} ${block.startTime}–${block.endTime}</div>
                        <div class="suggestion-users">${durationText} • ${block.minParticipants} people</div>
                    </div>
                `;
                blocksContainer.appendChild(blockItem);
            });
            
            suggestionsList.appendChild(blocksContainer);
        }
    }

    renderUserIcons(users) {
        return users.map(user => this.getUserIcon(user)).join(' ');
    }

    // Share Menu Management
    toggleShareMenu() {
        const shareMenu = document.getElementById('shareMenu');
        shareMenu.classList.toggle('show');
    }

    hideShareMenu() {
        const shareMenu = document.getElementById('shareMenu');
        shareMenu.classList.remove('show');
    }

    // Enhanced Sharing Methods
    sharePoll() {
        // This method is now handled by the dropdown menu
        this.toggleShareMenu();
    }

    copyShareMessage() {
        if (!this.currentPoll) return;
        
        const url = window.location.href;
        const dateInfo = this.currentPoll.isDateMode 
            ? `${this.currentPoll.dates[0]} to ${this.currentPoll.dates[this.currentPoll.dates.length - 1]}`
            : `${this.getDayNames(this.currentPoll.days).join(', ')}`;
        
        const message = `📅 ${this.currentPoll.title}

Please mark your availability for ${dateInfo} from ${this.formatTime12Hour(...this.parseTime(this.currentPoll.startTime))} to ${this.formatTime12Hour(...this.parseTime(this.currentPoll.endTime))}.

Join the poll: ${url}

Powered by TimeSync`;

        this.copyToClipboard(message, 'Share message copied to clipboard');
    }

    showQRCode() {
        const url = window.location.href;
        const qrContainer = document.getElementById('qrCodeContainer');
        const modal = document.getElementById('qrModal');
        
        // Clear previous QR code
        qrContainer.innerHTML = '';
        
        // Generate QR code using a simple QR code service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        
        const qrImage = document.createElement('img');
        qrImage.src = qrCodeUrl;
        qrImage.alt = 'QR Code for poll';
        qrImage.style.maxWidth = '100%';
        qrImage.style.height = 'auto';
        
        qrContainer.appendChild(qrImage);
        modal.style.display = 'flex';
    }

    hideQRModal() {
        const modal = document.getElementById('qrModal');
        modal.style.display = 'none';
    }

    downloadQRCode() {
        const url = window.location.href;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
        
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `${this.currentPoll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('QR code downloaded');
    }

    exportToCalendar() {
        if (!this.currentPoll) return;
        
        try {
            const icsContent = this.generateICSFile();
            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.currentPoll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_schedule.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            this.showToast('Calendar file downloaded');
        } catch (error) {
            console.error('Error generating calendar file:', error);
            this.showToast('Error generating calendar file', 3000, 'error');
        }
    }

    generateICSFile() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TimeSync//TimeSync Scheduler//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        // Get suggested times for calendar events
        const suggestions = this.calculateBestTimes();
        
        if (suggestions && suggestions.bestSingle.length > 0) {
            suggestions.bestSingle.forEach((suggestion, index) => {
                const eventDate = this.getDateForSuggestion(suggestion);
                const startDateTime = this.combineDateAndTime(eventDate, suggestion.time);
                const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
                
                const eventId = `timesync-${this.currentPoll.id}-${index}-${timestamp}`;
                
                icsContent.push(
                    'BEGIN:VEVENT',
                    `UID:${eventId}`,
                    `DTSTAMP:${timestamp}`,
                    `DTSTART:${this.formatDateTimeForICS(startDateTime)}`,
                    `DTEND:${this.formatDateTimeForICS(endDateTime)}`,
                    `SUMMARY:${this.escapeICSText(this.currentPoll.title)} - Option ${index + 1}`,
                    `DESCRIPTION:${this.escapeICSText(`Suggested meeting time from TimeSync poll. ${suggestion.availableCount} participants available: ${suggestion.users.join(', ')}`)}`,
                    `LOCATION:`,
                    `STATUS:TENTATIVE`,
                    'END:VEVENT'
                );
            });
        } else {
            // Create a placeholder event if no suggestions
            const eventDate = this.currentPoll.isDateMode 
                ? new Date(this.currentPoll.dates[0])
                : this.getNextDateForDay(this.currentPoll.days[0]);
            
            const startDateTime = this.combineDateAndTime(eventDate, this.currentPoll.startTime);
            const endDateTime = this.combineDateAndTime(eventDate, this.currentPoll.endTime);
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:timesync-${this.currentPoll.id}-placeholder-${timestamp}`,
                `DTSTAMP:${timestamp}`,
                `DTSTART:${this.formatDateTimeForICS(startDateTime)}`,
                `DTEND:${this.formatDateTimeForICS(endDateTime)}`,
                `SUMMARY:${this.escapeICSText(this.currentPoll.title)} - Scheduling Poll`,
                `DESCRIPTION:${this.escapeICSText(`TimeSync scheduling poll. Please visit the poll to mark your availability.`)}`,
                `LOCATION:`,
                `STATUS:TENTATIVE`,
                'END:VEVENT'
            );
        }

        icsContent.push('END:VCALENDAR');
        return icsContent.join('\r\n');
    }

    copyUrlToClipboard(url) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Poll URL copied to clipboard');
            }).catch(() => {
                this.fallbackCopy(url);
            });
        } else {
            this.fallbackCopy(url);
        }
    }

    copyCalendarLink() {
        if (!this.currentPoll) return;
        
        try {
            const calendarData = this.generateCalendarSchedule();
            const calendarText = this.formatCalendarText(calendarData);
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(calendarText).then(() => {
                    this.showToast('Calendar schedule copied to clipboard');
                }).catch(() => {
                    this.fallbackCopy(calendarText);
                });
            } else {
                this.fallbackCopy(calendarText);
            }
        } catch (error) {
            console.error('Error generating calendar:', error);
            this.showToast('Error generating calendar data');
        }
    }

    fallbackCopy(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showToast('Calendar schedule copied to clipboard');
            } else {
                this.showToast('Could not copy to clipboard. Please copy manually.');
            }
        } catch (error) {
            console.error('Fallback copy failed:', error);
            this.showToast('Copy failed. Please copy the URL manually.');
        }
    }

    generateCalendarSchedule() {
        const schedule = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Initialize schedule structure
        this.currentPoll.days.forEach(dayIndex => {
            schedule[dayNames[dayIndex]] = {};
        });
        
        // Get all time slots
        const timeSlots = this.generateTimeSlots();
        
        // For each time slot, find who's available
        timeSlots.forEach(time => {
            if (this.currentPoll.isDateMode) {
                this.currentPoll.dates.forEach((dateStr, index) => {
                    const key = `date-${index}-${time}`;
                    const availableUsers = Object.keys(this.allAvailability).filter(user => 
                        this.allAvailability[user][key]
                    );
                    
                    if (availableUsers.length > 0) {
                        const date = new Date(dateStr);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                        const displayTime = this.formatTimeForDisplay(time);
                        if (!schedule[dayName]) schedule[dayName] = {};
                        schedule[dayName][displayTime] = availableUsers;
                    }
                });
            } else {
                this.currentPoll.days.forEach(dayIndex => {
                    const key = `${dayIndex}-${time}`;
                    const availableUsers = Object.keys(this.allAvailability).filter(user => 
                        this.allAvailability[user][key]
                    );
                    
                    if (availableUsers.length > 0) {
                        const displayTime = this.formatTimeForDisplay(time);
                        schedule[dayNames[dayIndex]][displayTime] = availableUsers;
                    }
                });
            }
        });
        
        return schedule;
    }

    formatCalendarText(schedule) {
        let text = `${this.currentPoll.title}\n`;
        text += `${'='.repeat(this.currentPoll.title.length)}\n\n`;
        
        Object.keys(schedule).forEach(day => {
            const daySchedule = schedule[day];
            if (Object.keys(daySchedule).length > 0) {
                text += `${day}:\n`;
                Object.keys(daySchedule).forEach(time => {
                    const users = daySchedule[time];
                    text += `  ${time}: ${users.join(', ')}\n`;
                });
                text += '\n';
            }
        });
        
        if (text === `${this.currentPoll.title}\n${'='.repeat(this.currentPoll.title.length)}\n\n`) {
            text += 'No availability marked yet.\n';
        }
        
        text += `\nGenerated from TimeSync: ${window.location.href}`;
        
        return text;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Helper methods for calendar export
    copyToClipboard(text, successMessage) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(successMessage);
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return [hours, minutes];
    }

    getDayNames(dayNumbers) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayNumbers.map(num => dayNames[num]);
    }

    getDateForSuggestion(suggestion) {
        if (this.currentPoll.isDateMode) {
            // Find the date that matches the suggestion day
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDayIndex = dayNames.indexOf(suggestion.day);
            
            for (const dateStr of this.currentPoll.dates) {
                const date = new Date(dateStr);
                if (date.getDay() === targetDayIndex) {
                    return date;
                }
            }
            // Fallback to first date
            return new Date(this.currentPoll.dates[0]);
        } else {
            // For general days, find the next occurrence of this day
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDayIndex = dayNames.indexOf(suggestion.day);
            return this.getNextDateForDay(targetDayIndex);
        }
    }

    getNextDateForDay(dayOfWeek) {
        const today = new Date();
        const targetDay = new Date(today);
        const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
        targetDay.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        return targetDay;
    }

    combineDateAndTime(date, timeString) {
        const [hours, minutes] = this.parseTime(timeString);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined;
    }

    formatDateTimeForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    escapeICSText(text) {
        return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    }

    savePollToStorage() {
        if (this.currentPoll) {
            try {
                const pollData = {
                    poll: this.currentPoll,
                    availability: this.allAvailability,
                    lastModified: new Date().toISOString()
                };
                localStorage.setItem(`timesync_poll_${this.currentPoll.id}`, JSON.stringify(pollData));
            } catch (error) {
                console.error('Failed to save poll data:', error);
                this.showToast('Warning: Could not save data locally');
            }
        }
    }

    loadPollFromStorage(pollId) {
        try {
            const stored = localStorage.getItem(`timesync_poll_${pollId}`);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Validate poll data structure
                if (!data.poll || !data.poll.id || !data.poll.title) {
                    console.error('Invalid poll data structure');
                    return false;
                }
                
                this.currentPoll = data.poll;
                this.allAvailability = data.availability || {};
                return true;
            }
        } catch (error) {
            console.error('Failed to load poll data:', error);
            this.showToast('Error loading poll data');
        }
        return false;
    }

    loadPollFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const pollId = urlParams.get('poll');
        
        if (pollId) {
            if (this.loadPollFromStorage(pollId)) {
                this.displayPoll();
                this.showToast('Poll loaded successfully!');
            } else {
                this.showToast('Poll not found. It may have been deleted or the link is invalid.', 5000, 'error');
                // Clean up the URL
                const url = new URL(window.location);
                url.searchParams.delete('poll');
                window.history.replaceState({}, '', url);
            }
        }
    }

    updateURL() {
        if (this.currentPoll) {
            const url = new URL(window.location);
            url.searchParams.set('poll', this.currentPoll.id);
            window.history.pushState({}, '', url);
        }
    }

    resetApp() {
        // Confirm if there's existing data
        if (this.currentPoll && Object.keys(this.allAvailability).length > 0) {
            if (!confirm('Are you sure you want to create a new poll? This will clear all current data.')) {
                return;
            }
        }
        
        this.selectedDays.clear();
        this.selectedDates = [];
        this.currentPoll = null;
        this.userAvailability = {};
        this.allAvailability = {};
        this.currentUser = null;
        this.isDragging = false;
        this.dragMode = null;
        
        document.getElementById('pollCreator').style.display = 'block';
        document.getElementById('pollDisplay').style.display = 'none';
        document.getElementById('pollTitle').value = '';
        document.getElementById('userName').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        // Reset to general days mode
        this.switchToGeneralDays();
        
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Clear URL
        const url = new URL(window.location);
        url.searchParams.delete('poll');
        window.history.pushState({}, '', url);
        
        this.showToast('Ready to create a new poll!');
    }

    showToast(message, duration = 3000, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
        
        // Add accessibility announcement
        this.announceToScreenReader(message);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    initializeTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('timesync-theme');
        
        if (savedTheme) {
            // Use saved preference
            this.setTheme(savedTheme);
        } else {
            // Auto-detect system preference
            this.setSystemTheme();
        }
        
        // Listen for system theme changes
        this.setupSystemThemeListener();
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setSystemTheme() {
        const systemTheme = this.getSystemTheme();
        this.setTheme(systemTheme, false); // Don't save to localStorage for auto mode
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-update if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('timesync-theme');
            if (!savedTheme) {
                this.setSystemTheme();
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const savedTheme = localStorage.getItem('timesync-theme');
        
        if (!savedTheme) {
            // Currently in auto mode, switch to light
            this.setTheme('light', true);
        } else if (savedTheme === 'light') {
            // Currently light, switch to dark
            this.setTheme('dark', true);
        } else {
            // Currently dark, switch back to auto (system)
            localStorage.removeItem('timesync-theme');
            this.setSystemTheme();
        }
        
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const savedTheme = localStorage.getItem('timesync-theme');
        const themeIcon = document.querySelector('.theme-icon');
        
        if (!savedTheme) {
            // Auto mode - show system indicator
            themeIcon.textContent = '🔄';
        } else {
            themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    setTheme(theme, savePreference = true) {
        document.documentElement.setAttribute('data-theme', theme);
        
        if (savePreference) {
            localStorage.setItem('timesync-theme', theme);
        }
        
        this.updateThemeIcon();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeSync();
});
