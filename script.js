class TimeSync {
    constructor() {
        this.selectedDays = new Set();
        this.currentPoll = null;
        this.userAvailability = {};
        this.allAvailability = {};
        this.currentUser = null;
        
        this.initializeTimeOptions();
        this.bindEvents();
        this.loadPollFromURL();
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

    bindEvents() {
        // Day selection
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = parseInt(e.target.dataset.day);
                if (this.selectedDays.has(day)) {
                    this.selectedDays.delete(day);
                    e.target.classList.remove('selected');
                } else {
                    this.selectedDays.add(day);
                    e.target.classList.add('selected');
                }
            });
        });

        // Create poll
        document.getElementById('createPollBtn').addEventListener('click', () => {
            this.createPoll();
        });

        // Add user
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.addUser();
        });

        // Share poll
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.sharePoll();
        });

        // Copy calendar link
        document.getElementById('copyCalendarBtn').addEventListener('click', () => {
            this.copyCalendarLink();
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

    createPoll() {
        const title = document.getElementById('pollTitle').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        if (!title) {
            this.showToast('Please enter a poll title');
            return;
        }

        if (this.selectedDays.size === 0) {
            this.showToast('Please select at least one day');
            return;
        }

        if (startTime >= endTime) {
            this.showToast('End time must be after start time');
            return;
        }

        this.currentPoll = {
            id: this.generateId(),
            title,
            days: Array.from(this.selectedDays).sort(),
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
        document.getElementById('currentTimezone').textContent = 
            `Your timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

        this.renderDaysHeader();
        this.renderAvailabilityGrid();
        this.renderParticipants();
        this.updateSuggestions();
    }

    renderDaysHeader() {
        const daysHeader = document.getElementById('daysHeader');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        daysHeader.innerHTML = '';
        daysHeader.style.gridTemplateColumns = `repeat(${this.currentPoll.days.length}, 1fr)`;
        
        this.currentPoll.days.forEach(dayIndex => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = dayNames[dayIndex];
            daysHeader.appendChild(dayHeader);
        });
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
            timeSlotsContainer.style.gridTemplateColumns = `repeat(${this.currentPoll.days.length}, 1fr)`;
            
            this.currentPoll.days.forEach(dayIndex => {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.dataset.day = dayIndex;
                slot.dataset.time = time;
                
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
        const nameInput = document.getElementById('userName');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showToast('Please enter your name');
            return;
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
        this.showToast(`Welcome, ${name}! Click on time slots to mark your availability.`);
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
            
            // Apply shading based on number of people available
            if (availableUsers.length > 0) {
                const totalUsers = Object.keys(this.allAvailability).length;
                const intensity = Math.min(availableUsers.length / Math.max(totalUsers, 1), 1);
                
                // Check if current user is available for this slot
                const currentUserAvailable = this.currentUser && 
                    this.allAvailability[this.currentUser] && 
                    this.allAvailability[this.currentUser][key];
                
                if (currentUserAvailable) {
                    // Current user's slots are black with varying opacity
                    const opacity = 0.3 + (intensity * 0.7); // Range from 0.3 to 1.0
                    slot.style.backgroundColor = `rgba(26, 26, 26, ${opacity})`;
                    slot.classList.add('available');
                } else {
                    // Other users' slots are light gray with varying opacity
                    const opacity = 0.1 + (intensity * 0.3); // Range from 0.1 to 0.4
                    slot.style.backgroundColor = `rgba(26, 26, 26, ${opacity})`;
                }
            }
            
            // Update participants display
            const participantsDiv = slot.querySelector('.time-slot-participants');
            participantsDiv.innerHTML = '';
            
            availableUsers.forEach(user => {
                const dot = document.createElement('div');
                dot.className = 'participant-dot';
                dot.title = user;
                dot.style.backgroundColor = this.getUserColor(user);
                participantsDiv.appendChild(dot);
            });
        });
    }

    getUserColor(username) {
        // Generate a consistent color based on username
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 50%)`;
    }

    renderParticipants() {
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';
        
        Object.keys(this.allAvailability).forEach(user => {
            const tag = document.createElement('div');
            tag.className = 'participant-tag';
            tag.textContent = user;
            tag.style.backgroundColor = this.getUserColor(user);
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
        });

        if (slotAvailability.length === 0) {
            return null;
        }

        // Find best single time slot (highest percentage)
        const bestSingleSlot = slotAvailability.reduce((best, current) => 
            current.percentage > best.percentage ? current : best
        );

        // Find longest consecutive block with most participants
        const longestBlock = this.findLongestConsecutiveBlock(slotAvailability, timeSlots);

        return {
            bestSingle: bestSingleSlot,
            longestBlock: longestBlock
        };
    }

    findLongestConsecutiveBlock(slotAvailability, timeSlots) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let bestBlock = null;
        let maxScore = 0;

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
                            if (score > maxScore) {
                                maxScore = score;
                                bestBlock = {
                                    day: dayNames[dayIndex],
                                    startTime: currentBlock[0].time,
                                    endTime: currentBlock[currentBlock.length - 1].time,
                                    duration: currentBlock.length * 15, // minutes
                                    minParticipants: currentMinParticipants,
                                    slots: currentBlock.length
                                };
                            }
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
                if (score > maxScore) {
                    maxScore = score;
                    bestBlock = {
                        day: dayNames[dayIndex],
                        startTime: currentBlock[0].time,
                        endTime: currentBlock[currentBlock.length - 1].time,
                        duration: currentBlock.length * 15,
                        minParticipants: currentMinParticipants,
                        slots: currentBlock.length
                    };
                }
            }
        });

        return bestBlock;
    }

    renderSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        if (!suggestions) {
            suggestionsList.innerHTML = '<div class="suggestion-item">No availability overlap found yet.</div>';
            return;
        }

        // Best single time slot
        if (suggestions.bestSingle) {
            const bestItem = document.createElement('div');
            bestItem.className = 'suggestion-item';
            bestItem.innerHTML = `
                <div class="suggestion-label">Best Single Time</div>
                ${suggestions.bestSingle.day} at ${suggestions.bestSingle.time}<br>
                ${suggestions.bestSingle.availableCount} people available (${suggestions.bestSingle.percentage}%)
            `;
            suggestionsList.appendChild(bestItem);
        }

        // Longest consecutive block
        if (suggestions.longestBlock) {
            const blockItem = document.createElement('div');
            blockItem.className = 'suggestion-item';
            const hours = Math.floor(suggestions.longestBlock.duration / 60);
            const minutes = suggestions.longestBlock.duration % 60;
            const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            
            blockItem.innerHTML = `
                <div class="suggestion-label">Longest Available Block</div>
                ${suggestions.longestBlock.day} from ${suggestions.longestBlock.startTime} to ${suggestions.longestBlock.endTime}<br>
                ${durationText} with ${suggestions.longestBlock.minParticipants} people available
            `;
            suggestionsList.appendChild(blockItem);
        }
    }

    sharePoll() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: this.currentPoll.title,
                text: 'Join my scheduling poll on TimeSync',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Poll URL copied to clipboard');
            }).catch(() => {
                this.showToast('Unable to copy URL. Please copy manually from address bar.');
            });
        }
    }

    copyCalendarLink() {
        if (!this.currentPoll) return;
        
        const calendarData = this.generateCalendarSchedule();
        const calendarText = this.formatCalendarText(calendarData);
        
        navigator.clipboard.writeText(calendarText).then(() => {
            this.showToast('Calendar schedule copied to clipboard');
        }).catch(() => {
            // Fallback: create a text area and copy manually
            const textArea = document.createElement('textarea');
            textArea.value = calendarText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Calendar schedule copied to clipboard');
        });
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

    savePollToStorage() {
        if (this.currentPoll) {
            const pollData = {
                poll: this.currentPoll,
                availability: this.allAvailability
            };
            localStorage.setItem(`timesync_poll_${this.currentPoll.id}`, JSON.stringify(pollData));
        }
    }

    loadPollFromStorage(pollId) {
        const stored = localStorage.getItem(`timesync_poll_${pollId}`);
        if (stored) {
            const data = JSON.parse(stored);
            this.currentPoll = data.poll;
            this.allAvailability = data.availability || {};
            return true;
        }
        return false;
    }

    loadPollFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const pollId = urlParams.get('poll');
        
        if (pollId && this.loadPollFromStorage(pollId)) {
            this.displayPoll();
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
        this.selectedDays.clear();
        this.currentPoll = null;
        this.userAvailability = {};
        this.allAvailability = {};
        this.currentUser = null;
        
        document.getElementById('pollCreator').style.display = 'block';
        document.getElementById('pollDisplay').style.display = 'none';
        document.getElementById('pollTitle').value = '';
        document.getElementById('userName').value = '';
        
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Clear URL
        const url = new URL(window.location);
        url.searchParams.delete('poll');
        window.history.pushState({}, '', url);
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeSync();
});
