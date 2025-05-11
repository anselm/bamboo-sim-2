// Global object to store entity totals over time
const entityTotals = {};

// Function to count entities and update totals
function updateEntityTotals() {
    const db = globalThis.db;
    const currentTotals = {};

    Object.values(db.entities).forEach(entity => {
        if (entity.type) {
            currentTotals[entity.type] = (currentTotals[entity.type] || 0) + 1;
        }
    });

    // Update the global entityTotals object
    Object.keys(currentTotals).forEach(type => {
        if (!entityTotals[type]) {
            entityTotals[type] = [];
        }
        entityTotals[type].push(currentTotals[type]);
    });

    // Optionally, log the current totals
    console.log('Current entity totals:', currentTotals);
}

// Function to get analytics data
function getAnalytics() {
    return entityTotals;
}

// Set up interval to update entity totals every second
//setInterval(updateEntityTotals, 1000);

// Export the getAnalytics function
export { getAnalytics };


/*


import { getAnalytics } from './analytics.js';

    // Log analytics every hour
    if (state.secondOfDay % 3600 < state.secondsStepRate) {
        const analytics = getAnalytics();
        console.log('Analytics - Entity Totals Over Time:', analytics);
    }
}



*/