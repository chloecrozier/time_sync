# TimeSync System Limitations

This document outlines the technical limitations and constraints of the TimeSync scheduling application.

## 📊 User & Participation Limits

### Maximum Participants
- **Recommended Maximum**: 100 users per poll
- **Technical Limit**: ~1000 users (performance may degrade)
- **Reason**: DOM rendering and calculation performance
- **Impact**: Slower suggestion calculations and UI updates with more users

### User Name Constraints
- **Maximum Length**: 50 characters
- **Minimum Length**: 1 character (non-empty)
- **Allowed Characters**: All Unicode characters
- **Duplicate Names**: Allowed but will prompt for confirmation

## 📅 Time & Date Constraints

### Poll Duration Limits
- **Minimum Time Range**: 30 minutes
- **Maximum Time Range**: 24 hours (1440 minutes)
- **Time Slot Granularity**: 15-minute increments
- **Maximum Time Slots**: 96 per day (24 hours ÷ 15 minutes)

### Date Range Limits
- **Maximum Date Range**: 7 consecutive days
- **Minimum Date Range**: 1 day
- **Past Date Restriction**: Cannot select dates in the past
- **Future Date Limit**: No technical limit, but recommended within 1 year

### General Days Mode
- **Maximum Days**: 7 days (all days of the week)
- **Minimum Days**: 1 day
- **Day Selection**: Any combination of weekdays

## 📝 Content Limits

### Poll Title
- **Maximum Length**: 100 characters
- **Minimum Length**: 1 character (non-empty)
- **Special Characters**: All Unicode characters supported
- **HTML/Script**: Not processed (displayed as plain text)

### Availability Selections
- **Maximum Selections per User**: 672 slots (7 days × 96 slots)
- **Minimum Selections**: 0 (no availability marked)
- **Bulk Selection**: Drag-to-select supported

## 💾 Storage Limitations

### Local Storage
- **Browser Limit**: ~5-10MB per domain (varies by browser)
- **Poll Data Size**: ~1KB per poll + ~100 bytes per user per selection
- **Estimated Capacity**: 
  - Small polls (10 users, 2 days): ~500 polls
  - Large polls (100 users, 7 days): ~50 polls
- **Cleanup**: No automatic cleanup (manual poll deletion required)

### Session Storage
- **Theme Preference**: Stored indefinitely
- **Current Poll State**: Lost on page refresh if not saved
- **User Selection**: Lost on page refresh

## 🔧 Technical Constraints

### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Required Features**: 
  - ES6+ JavaScript support
  - CSS Grid and Flexbox
  - Local Storage API
  - Date input type
- **Optional Features**: 
  - Clipboard API (fallback available)
  - Web Share API (fallback available)

### Performance Benchmarks
- **Suggestion Calculation**: <5 seconds for 100 users × 7 days
- **Grid Rendering**: <2 seconds for maximum time slots
- **Data Persistence**: <1 second for typical poll sizes
- **Memory Usage**: <50MB for large polls

## 📱 Mobile & Responsive Limits

### Screen Size Support
- **Minimum Width**: 320px (iPhone SE)
- **Maximum Width**: No limit (responsive design)
- **Optimal Range**: 375px - 1200px
- **Touch Targets**: Minimum 32px for accessibility

### Mobile-Specific Constraints
- **Drag Selection**: May be less precise on touch devices
- **Keyboard Navigation**: Limited on mobile browsers
- **Clipboard Access**: May require user gesture on iOS

## 🌐 Network & Sharing

### URL Sharing
- **Poll ID Length**: 9 characters (alphanumeric)
- **URL Length**: ~100 characters typical
- **Sharing Methods**: 
  - Direct URL copy
  - Web Share API (where supported)
  - QR code generation (via external service)
  - Formatted share messages
  - Calendar (.ics) file export
  - Manual copy fallback

### QR Code Generation
- **Service Dependency**: Uses qrserver.com API
- **QR Code Size**: 200x200px (display), 400x400px (download)
- **Network Requirement**: Internet connection required for QR generation
- **Download Format**: PNG image file

### Calendar Export
- **File Format**: iCalendar (.ics) standard
- **Event Creation**: Based on poll suggestions or time range
- **Compatibility**: Google Calendar, Outlook, Apple Calendar
- **File Size**: ~1-5KB per exported calendar
- **Event Duration**: 1 hour default for suggestions

### Offline Functionality
- **Core Features**: Work offline after initial load
- **Sharing**: Requires internet connection
- **Data Sync**: No automatic sync between devices

## 🔒 Security Limitations

### Data Privacy
- **Storage Location**: Client-side only (localStorage)
- **Data Transmission**: None (no server communication)
- **Encryption**: None (plain text storage)
- **Access Control**: None (anyone with URL can access)

### Input Validation
- **XSS Protection**: Basic (text content only, no HTML rendering)
- **Input Sanitization**: Limited to length and format validation
- **CSRF Protection**: Not applicable (no server-side operations)

## ⚡ Performance Considerations

### Calculation Complexity
- **Best Time Algorithm**: O(n × m) where n = users, m = time slots
- **Consecutive Block Algorithm**: O(n × m × d) where d = days
- **Memory Usage**: Linear with user count and selections

### UI Rendering Limits
- **DOM Elements**: ~1000 time slots maximum recommended
- **Animation Performance**: May degrade with >50 participants
- **Scroll Performance**: Optimized for up to 96 time slots vertically

## 🚨 Known Issues & Workarounds

### Browser-Specific Issues
1. **Safari Date Input**: May not respect min/max attributes
   - **Workaround**: JavaScript validation enforced
2. **iOS Clipboard**: Requires user interaction
   - **Workaround**: Fallback to manual copy instructions
3. **Firefox Drag Events**: May not work consistently
   - **Workaround**: Click selection always available

### Edge Cases
1. **Timezone Changes**: Not automatically handled during poll creation
2. **Daylight Saving**: May cause confusion in date mode
3. **Leap Years**: February 29th handled correctly
4. **Browser Crashes**: Data loss possible if not saved

## 📈 Scalability Recommendations

### For Large Organizations
- **Split Large Groups**: Create multiple polls for >100 participants
- **Time Range Optimization**: Use shorter time ranges for better performance
- **Regular Cleanup**: Delete old polls to free storage space

### For Extended Use
- **Browser Cache**: Clear periodically to free memory
- **Data Export**: Use calendar export feature for record keeping
- **Multiple Devices**: No sync - use one primary device per poll

## 🔮 Future Considerations

### Potential Improvements
- Server-side storage for larger capacity
- Real-time collaboration features
- Advanced timezone handling
- Bulk user import/export
- Poll templates and recurring events

### Technical Debt
- Consider migrating to IndexedDB for larger storage
- Implement service worker for better offline support
- Add automated testing for browser compatibility
- Optimize algorithms for better performance at scale

---

*Last Updated: December 2024*
*Version: 1.0*

For technical support or questions about these limitations, please refer to the test suite in this directory or create an issue in the project repository.
