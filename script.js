// DOM Elements
const arrayInput = document.getElementById('arrayInput');
const targetInput = document.getElementById('targetInput');
const executeSearchBtn = document.getElementById('executeSearchBtn');
const generateRandomBtn = document.getElementById('generateRandomBtn');

const linearArrayDisplay = document.getElementById('linearArrayDisplay');
const linearStepsText = document.getElementById('linearSteps');
const linearIndexText = document.getElementById('linearIndex');

const binaryArrayDisplay = document.getElementById('binaryArrayDisplay');
const binaryStepsText = document.getElementById('binarySteps');
const binaryIndexText = document.getElementById('binaryIndex');

const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const overlay = document.getElementById('overlay');

let currentArray = [];
let isAnimating = false; // Flag to prevent multiple animations at once
let linearSearchTime = 0;
let binarySearchTime = 0;

// D3 Chart setup
const chartSvg = d3.select("#timeTakenChart");
const chartMargin = { top: 20, right: 20, bottom: 40, left: 80 };
const chartWidth = chartSvg.node().getBoundingClientRect().width - chartMargin.left - chartMargin.right;
const chartHeight = chartSvg.node().getBoundingClientRect().height - chartMargin.top - chartMargin.bottom;

const chartG = chartSvg.append("g")
    .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

const xScale = d3.scaleLinear()
    .range([0, chartWidth]);

const yScale = d3.scaleBand()
    .range([0, chartHeight])
    .padding(0.3);

const xAxis = chartG.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight})`);

const yAxis = chartG.append("g")
    .attr("class", "y-axis");

// Add X-axis label
chartG.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + chartMargin.bottom - 5)
    .text("Time Taken");

// --- Utility Functions ---

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
}

/**
 * Hides the custom message box.
 */
function hideMessageBox() {
    messageBox.style.display = 'none';
    overlay.style.display = 'none';
}

/**
 * Parses the input string into an array of numbers.
 * Validates if all elements are numbers and within the 1-100 range.
 * @param {string} inputString - The comma-separated string of numbers.
 * @returns {number[]|null} - An array of numbers or null if invalid.
 */
function parseInputArray(inputString) {
    if (!inputString.trim()) {
        showMessageBox('Array input cannot be empty.');
        return null;
    }
    const elements = inputString.split(',').map(s => parseInt(s.trim(), 10));
    if (elements.some(isNaN)) {
        showMessageBox('Invalid array input. Please enter comma-separated numbers only.');
        return null;
    }
    if (elements.some(num => num < 1 || num > 100)) {
        showMessageBox('Array elements must be between 1 and 100.');
        return null;
    }
    return elements;
}

/**
 * Clears the display for both search algorithms and resets chart.
 */
function clearResults() {
    linearArrayDisplay.innerHTML = '';
    linearStepsText.textContent = 'Steps taken: 0';
    linearIndexText.textContent = 'Index found at: -';

    binaryArrayDisplay.innerHTML = '';
    binaryStepsText.textContent = 'Steps taken: 0';
    binaryIndexText.textContent = 'Index found at: -';

    linearSearchTime = 0;
    binarySearchTime = 0;
    updateChart(linearSearchTime, binarySearchTime); // Reset chart
}

/**
 * Renders an array visually into a specified DOM element.
 * @param {number[]} arr - The array to display.
 * @param {HTMLElement} displayElement - The DOM element to render into.
 * @param {string} idPrefix - Prefix for element IDs (e.g., 'linear-el-', 'binary-el-').
 */
function displayArray(arr, displayElement, idPrefix) {
    displayElement.innerHTML = ''; // Clear previous display
    arr.forEach((num, index) => {
        const el = document.createElement('div');
        el.className = 'array-element';
        el.id = `${idPrefix}${index}`;
        el.textContent = num;
        displayElement.appendChild(el);
    });
}

/**
 * Highlights an array element with a specific color class.
 * @param {HTMLElement} element - The array element DOM node.
 * @param {string} className - The Tailwind class for highlighting (e.g., 'highlight-current', 'highlight-found').
 */
function highlightElement(element, className) {
    element.classList.add(className);
}

/**
 * Resets the highlight of an array element.
 * @param {HTMLElement} element - The array element DOM node.
 * @param {string} className - The Tailwind class to remove.
 */
function resetElementColor(element, className) {
    element.classList.remove(className);
}

/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Search Algorithms ---

/**
 * Performs a linear search and records each step.
 * @param {number[]} arr - The array to search.
 * @param {number} target - The number to find.
 * @returns {Array<{index: number, status: string}>} - An array of steps.
 */
function linearSearch(arr, target) {
    const steps = [];
    let foundIndex = -1;
    for (let i = 0; i < arr.length; i++) {
        steps.push({ index: i, status: 'checking' });
        if (arr[i] === target) {
            foundIndex = i;
            steps.push({ index: i, status: 'found' });
            break; // Target found
        }
    }
    // If not found, add a final step indicating no find
    if (foundIndex === -1 && arr.length > 0) {
         steps.push({ index: -1, status: 'not-found' });
    } else if (arr.length === 0) {
         steps.push({ index: -1, status: 'empty-array' });
    }
    return steps;
}

/**
 * Performs a binary search on a sorted array and records each step.
 * @param {number[]} arr - The sorted array to search.
 * @param {number} target - The number to find.
 * @returns {Array<{index: number, status: string}>} - An array of steps.
 */
function binarySearch(arr, target) {
    const steps = [];
    let low = 0;
    let high = arr.length - 1;
    let foundIndex = -1;

    if (arr.length === 0) {
        steps.push({ index: -1, status: 'empty-array' });
        return steps;
    }

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        steps.push({ index: mid, status: 'checking');

        if (arr[mid] === target) {
            foundIndex = mid;
            steps.push({ index: mid, status: 'found' });
            break;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    // If not found, add a final step indicating no find
    if (foundIndex === -1) {
        steps.push({ index: -1, status: 'not-found' });
    }
    return steps;
}

// --- Animation Functions ---

/**
 * Animates the linear search process.
 * @param {number[]} arr - The array being searched.
 * @param {number[]} steps - The recorded steps of the search.
 */
async function startLinearSearchAnimation(arr, steps) {
    linearStepsText.textContent = 'Steps taken: 0';
    linearIndexText.textContent = 'Index found at: -';
    displayArray(arr, linearArrayDisplay, 'linear-el-'); // Initial display

    let stepCount = 0;
    let found = false;
    let lastHighlightedElement = null;

    for (const step of steps) {
        if (isAnimating === false) break; // Stop if animation is cancelled

        if (step.status === 'checking') {
            stepCount++;
            linearStepsText.textContent = `Steps taken: ${stepCount}`;

            // Reset previous highlight if exists
            if (lastHighlightedElement) {
                resetElementColor(lastHighlightedElement, 'highlight-current');
            }

            const currentElement = document.getElementById(`linear-el-${step.index}`);
            if (currentElement) {
                highlightElement(currentElement, 'highlight-current');
                lastHighlightedElement = currentElement;
            }
            await delay(1000); // Wait for 1 second
        } else if (step.status === 'found') {
            stepCount++;
            linearStepsText.textContent = `Steps taken: ${stepCount}`;
            linearIndexText.textContent = `Index found at: ${step.index}`;
            found = true;

            // Ensure the found element is highlighted green
            const foundElement = document.getElementById(`linear-el-${step.index}`);
            if (foundElement) {
                // Remove blue if it's still there
                resetElementColor(foundElement, 'highlight-current');
                highlightElement(foundElement, 'highlight-found');
            }
            await delay(1000); // Wait for 1 second
            break; // Stop animation after finding
        } else if (step.status === 'not-found') {
            // No specific visual for not found, just update text
            linearIndexText.textContent = 'Index found at: Not Found';
            if (lastHighlightedElement) {
                resetElementColor(lastHighlightedElement, 'highlight-current');
            }
        } else if (step.status === 'empty-array') {
            linearIndexText.textContent = 'Index found at: Array is empty';
        }
    }

    if (!found && lastHighlightedElement) {
        resetElementColor(lastHighlightedElement, 'highlight-current');
    }
    linearSearchTime = stepCount; // Store the final step count
}

/**
 * Animates the binary search process.
 * @param {number[]} arr - The array being searched.
 * @param {number[]} steps - The recorded steps of the search.
 */
async function startBinarySearchAnimation(arr, steps) {
    binaryStepsText.textContent = 'Steps taken: 0';
    binaryIndexText.textContent = 'Index found at: -';
    displayArray(arr, binaryArrayDisplay, 'binary-el-'); // Initial display

    let stepCount = 0;
    let found = false;
    let lastHighlightedElement = null;

    for (const step of steps) {
        if (isAnimating === false) break; // Stop if animation is cancelled

        if (step.status === 'checking') {
            stepCount++;
            binaryStepsText.textContent = `Steps taken: ${stepCount}`;

            // Reset previous highlight if exists
            if (lastHighlightedElement) {
                resetElementColor(lastHighlightedElement, 'highlight-current');
            }

            const currentElement = document.getElementById(`binary-el-${step.index}`);
            if (currentElement) {
                highlightElement(currentElement, 'highlight-current');
                lastHighlightedElement = currentElement;
            }
            await delay(1000); // Wait for 1 second
        } else if (step.status === 'found') {
            stepCount++;
            binaryStepsText.textContent = `Steps taken: ${stepCount}`;
            binaryIndexText.textContent = `Index found at: ${step.index}`;
            found = true;

            // Ensure the found element is highlighted green
            const foundElement = document.getElementById(`binary-el-${step.index}`);
            if (foundElement) {
                // Remove blue if it's still there
                resetElementColor(foundElement, 'highlight-current');
                highlightElement(foundElement, 'highlight-found');
            }
            await delay(1000); // Wait for 1 second
            break; // Stop animation after finding
        } else if (step.status === 'not-found') {
            // No specific visual for not found, just update text
            binaryIndexText.textContent = 'Index found at: Not Found';
            if (lastHighlightedElement) {
                resetElementColor(lastHighlightedElement, 'highlight-current');
            }
        } else if (step.status === 'empty-array') {
            binaryIndexText.textContent = 'Index found at: Array is empty';
        }
    }

    if (!found && lastHighlightedElement) {
        resetElementColor(lastHighlightedElement, 'highlight-current');
    }
    binarySearchTime = stepCount; // Store the final step count
}

// --- Chart Update Function ---
/**
 * Updates the horizontal bar chart with new time taken values.
 * @param {number} linearTime - Time taken for linear search.
 * @param {number} binaryTime - Time taken for binary search.
 */
function updateChart(linearTime, binaryTime) {
    const data = [
        { name: 'Linear Search', time: linearTime },
        { name: 'Binary Search', time: binaryTime }
    ];

    // Update scales based on new data
    xScale.domain([0, d3.max(data, d => d.time) + 1 || 1]); // Ensure domain is at least 1
    yScale.domain(data.map(d => d.name));

    // Update X-axis
    xAxis.transition().duration(500).call(d3.axisBottom(xScale).ticks(Math.max(d3.max(data, d => d.time) || 1, 2)).tickFormat(d3.format("d")));

    // Update Y-axis
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));

    // Select all bars and bind data
    const bars = chartG.selectAll(".bar")
        .data(data, d => d.name);

    // Enter new bars
    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.name))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", 0) // Start with zero width for animation
        .transition().duration(750)
        .attr("width", d => xScale(d.time));

    // Update existing bars
    bars.transition().duration(750)
        .attr("y", d => yScale(d.name))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.time));

    // Remove old bars (if any)
    bars.exit().transition().duration(500).attr("width", 0).remove();

    // Select all labels and bind data
    const labels = chartG.selectAll(".bar-label")
        .data(data, d => d.name);

    // Enter new labels
    labels.enter().append("text")
        .attr("class", "bar-label")
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2 + 5) // Center vertically
        .attr("x", d => xScale(d.time) + 5) // Position slightly after the bar
        .text(d => `${d.time}s`)
        .style("text-anchor", "start") // Align text to start
        .style("opacity", 0) // Ensure initial opacity is 0
        .transition().delay(750).duration(250) // Delay until bar animation is almost done, then fade in
        .style("opacity", 1);

    // Update existing labels
    labels.transition().duration(750)
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2 + 5)
        .attr("x", d => xScale(d.time) + 5)
        .text(d => `${d.time}s`)
        .style("text-anchor", "start")
        .transition().delay(750).duration(250) // Delay until bar animation is almost done, then fade in
        .style("opacity", 1);

    // Remove old labels (if any)
    labels.exit().transition().duration(500).style("opacity", 0).remove();
}


// --- Event Handlers ---

/**
 * Handles the "Execute Search" button click.
 */
executeSearchBtn.addEventListener('click', async () => {
    if (isAnimating) {
        showMessageBox('An animation is already running. Please wait or refresh.');
        return;
    }

    const inputString = arrayInput.value;
    const targetNum = parseInt(targetInput.value, 10);

    currentArray = parseInputArray(inputString);
    if (!currentArray) {
        return; // Error message already shown by parseInputArray
    }

    if (isNaN(targetNum) || targetNum < 1 || targetNum > 100) {
        showMessageBox('Please enter a valid target number between 1 and 100.');
        return;
    }

    clearResults(); // Clear previous results and reset chart before starting new search
    isAnimating = true; // Set animation flag

    // Execute Linear Search
    const linearSteps = linearSearch(currentArray, targetNum);
    await startLinearSearchAnimation(currentArray, linearSteps);

    // Execute Binary Search
    const sortedArray = [...currentArray].sort((a, b) => a - b); // Create a sorted copy
    const binarySteps = binarySearch(sortedArray, targetNum);
    await startBinarySearchAnimation(sortedArray, binarySteps);

    // Update chart after both animations are complete
    updateChart(linearSearchTime, binarySearchTime);

    isAnimating = false; // Reset animation flag after both are done
});

/**
 * Handles the "Generate Random Array" button click.
 */
generateRandomBtn.addEventListener('click', () => {
    if (isAnimating) {
        showMessageBox('An animation is already running. Please wait or refresh.');
        return;
    }
    const randomElements = [];
    for (let i = 0; i < 6; i++) {
        randomElements.push(Math.floor(Math.random() * 100) + 1); // Numbers between 1 and 100
    }
    arrayInput.value = randomElements.join(', ');
    clearResults(); // Clear results and reset chart when new array is generated
});

// Initial state: clear results on load, without generating random array
window.onload = () => {
    clearResults(); // Ensure all displays are cleared and chart is reset
    arrayInput.value = ''; // Explicitly clear the input box
};
