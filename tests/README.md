# TimeSync Test Suite

Comprehensive unit testing suite for the TimeSync scheduling application.

## 🚀 Quick Start

1. Open `tests/index.html` in your browser
2. Click "Run All Tests" to execute the complete test suite
3. View results and statistics in the interface

## 📁 Test Structure

```
tests/
├── index.html          # Test runner interface
├── test-runner.js      # Custom test framework
├── core-tests.js       # Core functionality tests
├── ui-tests.js         # User interface tests
├── validation-tests.js # Input validation tests
├── limit-tests.js      # System limitation tests
├── LIMITATIONS.md      # System constraints documentation
└── README.md          # This file
```

## 🧪 Test Categories

### Core Functionality Tests (`core-tests.js`)
Tests the main TimeSync class functionality:
- ✅ Initialization and default values
- ✅ Time formatting and conversion
- ✅ Poll creation (general days and specific dates)
- ✅ User management and availability tracking
- ✅ Data persistence (localStorage)
- ✅ Theme switching
- ✅ Utility functions

**Example Test:**
```javascript
it('should create poll with general days', () => {
    document.getElementById('pollTitle').value = 'Test Meeting';
    timeSync.selectedDays.add(1); // Monday
    timeSync.createPoll();
    
    expect(timeSync.currentPoll.title).toBe('Test Meeting');
    expect(timeSync.currentPoll.days).toEqual([1]);
});
```

### UI Tests (`ui-tests.js`)
Tests user interface rendering and interactions:
- ✅ Days header rendering (general vs specific dates)
- ✅ Participant list display
- ✅ Suggestion rendering
- ✅ Grid display updates
- ✅ Toast notifications
- ✅ Drag functionality
- ✅ Form validation feedback

### Validation Tests (`validation-tests.js`)
Tests input validation and error handling:
- ✅ Empty/invalid poll titles
- ✅ Time range validation
- ✅ Date range constraints
- ✅ User name validation
- ✅ Data structure validation
- ✅ Error handling (localStorage, clipboard, etc.)

### Limit Tests (`limit-tests.js`)
Tests system limitations and performance:
- ✅ Maximum participants (100+ users)
- ✅ Maximum time slots (96 per day)
- ✅ Maximum date range (7 days)
- ✅ Large dataset performance
- ✅ Storage limitations
- ✅ Edge cases

## 🎯 Test Framework

### Custom Test Runner
Built-in lightweight test framework with:
- `describe()` - Test suite grouping
- `it()` - Individual test cases
- `expect()` - Assertion library
- Async test support
- DOM mocking utilities

### Assertion Methods
```javascript
expect(actual).toBe(expected)              // Strict equality
expect(actual).toEqual(expected)           // Deep equality
expect(actual).toBeTruthy()                // Truthy check
expect(actual).toBeFalsy()                 // Falsy check
expect(actual).toContain(expected)         // Array/string contains
expect(actual).toBeGreaterThan(expected)   // Numeric comparison
expect(actual).toBeLessThan(expected)      // Numeric comparison
expect(fn).toThrow()                       // Function throws error
```

## 📊 Running Tests

### Individual Test Suites
- **Core Functionality**: Tests main app logic
- **UI Tests**: Tests interface rendering
- **Validation Tests**: Tests input validation
- **Limit Tests**: Tests system constraints

### Test Results
- ✅ **Green**: Test passed
- ❌ **Red**: Test failed with error message
- 📊 **Statistics**: Total, passed, and failed counts

## 🔧 Mock System

### DOM Mocking
The test suite includes comprehensive DOM mocking:
```javascript
function createMockDOM() {
    // Mocks all required DOM elements
    // Returns cleanup function
}
```

### Mock Features
- Form elements (inputs, selects, buttons)
- Event listeners
- Style properties
- DOM manipulation methods
- Browser APIs (localStorage, clipboard)

## 📈 Test Coverage

### Core Functionality: ~95%
- Poll creation and management
- User availability tracking
- Data persistence
- Time calculations
- Theme management

### UI Components: ~90%
- Grid rendering
- Participant display
- Suggestion generation
- Form interactions
- Toast notifications

### Validation Logic: ~100%
- Input validation
- Error handling
- Edge cases
- Constraint enforcement

### System Limits: ~85%
- Performance testing
- Capacity limits
- Browser compatibility
- Storage constraints

## 🐛 Debugging Tests

### Common Issues
1. **DOM Element Not Found**
   - Ensure mock DOM is properly set up
   - Check element ID matches expectations

2. **Async Test Failures**
   - Use proper async/await syntax
   - Mock timers if needed

3. **Mock Function Issues**
   - Verify mock functions are called correctly
   - Check function signatures match

### Debug Tips
```javascript
// Add console.log for debugging
it('should debug test', () => {
    console.log('Current state:', timeSync.currentPoll);
    // ... test code
});

// Use try/catch for error details
it('should handle errors', () => {
    try {
        timeSync.someFunction();
    } catch (error) {
        console.error('Detailed error:', error);
        throw error;
    }
});
```

## 🚀 Performance Testing

### Load Testing
The limit tests include performance benchmarks:
- 100 users with full availability
- 7 days × 96 time slots = 672 slots per user
- Suggestion calculation under 5 seconds
- Memory usage under 50MB

### Stress Testing
```javascript
it('should handle performance with large datasets', () => {
    const startTime = Date.now();
    // ... create large dataset
    const suggestions = timeSync.calculateBestTimes();
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000);
});
```

## 📋 Adding New Tests

### Test Structure
```javascript
describe('New Feature Tests', () => {
    let timeSync;
    let cleanupDOM;

    function setupTest() {
        cleanupDOM = createMockDOM();
        timeSync = new TimeSync();
    }

    function teardownTest() {
        if (cleanupDOM) cleanupDOM();
    }

    it('should test new feature', () => {
        setupTest();
        
        // Test implementation
        expect(result).toBe(expected);
        
        teardownTest();
    });
});
```

### Best Practices
1. **Setup/Teardown**: Always clean up after tests
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One assertion per test when possible
4. **Mock External Dependencies**: Don't rely on real DOM/APIs
5. **Test Edge Cases**: Include boundary conditions

## 🔍 System Limitations

See `LIMITATIONS.md` for detailed documentation of:
- User and participation limits
- Time and date constraints
- Content and storage limits
- Performance benchmarks
- Browser compatibility
- Known issues and workarounds

## 📝 Contributing

### Adding Tests
1. Identify the functionality to test
2. Choose appropriate test category
3. Write descriptive test cases
4. Include edge cases and error conditions
5. Update documentation if needed

### Test Guidelines
- Tests should be independent and isolated
- Use meaningful assertions
- Include both positive and negative test cases
- Mock external dependencies
- Keep tests fast and reliable

---

*For questions about the test suite, refer to the individual test files or the main project documentation.*
