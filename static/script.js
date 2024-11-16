const BASE_URL = 'http://127.0.0.1:5000'; // Backend URL
let currentPage = 1; // Initialize current page
const blocksPerPage = 25; // Number of blocks to show per page
let isLoading = false; // Flag to prevent multiple simultaneous fetches
const tableContainer = document.querySelector('.overflow-y-auto'); // The container with the table (make sure this is correct)

// Fetch block data
async function fetchBlock() {
    const block = document.getElementById('block').value;
    if (!block) {
        alert('Please enter a block number or hash.');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/block/${block}`);
        const data = await response.json();
        displayResult(data);
    } catch (error) {
        displayResult({ error: 'Failed to fetch block data.' });
    }
}

// Fetch transaction data
async function fetchTransaction() {
    const tx = document.getElementById('tx').value;
    if (!tx) {
        alert('Please enter a transaction hash.');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/transaction/${tx}`);
        const data = await response.json();
        displayResult(data);
    } catch (error) {
        displayResult({ error: 'Failed to fetch transaction data.' });
    }
}

// Display results
function displayResult(data) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

async function fetchRecentBlocks() {
    const blockCount = blocksPerPage;

    try {
        // Fetch data for the current page
        const response = await fetch(`${BASE_URL}/recent_blocks/${blockCount}?page=${currentPage}`);
        const blocks = await response.json();

        const recentBlocksTable = document.getElementById('recent-blocks');
        
        // Check if we have blocks to display
        if (blocks.length > 0) {
            blocks.forEach(block => {
                const row = document.createElement('tr');
                row.className = 'bg-white border-b dark:bg-neutral-800 dark:border-gray-700';
                row.innerHTML = `
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.block_number}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${new Date(block.timestamp * 1000).toLocaleString()}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.transactions}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.miner}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.baseFeePerGas}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.gasLimit}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.gasUsed}</td>
                    <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">
                        <a class="font-medium text-blue-600 dark:text-sky-700 hover:underline" href="/block/${block.block_number}">
                            View Details
                        </a>
                    </td>
                `;
                recentBlocksTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching recent blocks:', error);
    }
}

// Pre-cache the next page for smooth scrolling
async function preCacheNextPage(nextPage) {
    try {
        const response = await fetch(`${BASE_URL}/recent_blocks/${blocksPerPage}?page=${nextPage}`);
        const blocks = await response.json();

        // Store the blocks in sessionStorage for faster access
        sessionStorage.setItem(`cachedBlocksPage_${nextPage}`, JSON.stringify(blocks));
    } catch (error) {
        console.error('Error pre-caching next page:', error);
    }
}

// Initialize the first page of blocks
fetchRecentBlocks();

// Event listener for scrolling
tableContainer.addEventListener('scroll', async () => {

    // If a request is already being processed, prevent further fetches
    if (isLoading) return;

    // Calculate the scroll position and check if we're near the bottom
    const scrollHeight = tableContainer.scrollHeight;
    const scrollPosition = tableContainer.scrollTop + tableContainer.clientHeight;
    // If the user is near the bottom (within 50px), load more data
    if (scrollPosition >= scrollHeight - (scrollHeight / 2)) {
        isLoading = true; // Set loading flag to true to prevent multiple fetches
        currentPage++; // Increment the page number
        await fetchRecentBlocks(); // Fetch the next page of blocks
        isLoading = false; // Reset the loading flag after fetching
    }
});

// Function to handle scroll event and load more blocks when needed
function handleScroll() {
    const tableContainer = document.querySelector('.overflow-auto'); // The container you're scrolling
    const scrollPosition = tableContainer.scrollTop + tableContainer.clientHeight;
    const scrollHeight = tableContainer.scrollHeight;

    if (scrollPosition >= scrollHeight - 50) {  // Trigger when you're 50px from the bottom
        loadMoreBlocks();
    }
}

// Function to load the cached data for the next page (if available)
function loadMoreBlocks() {
    const cachedBlocks = sessionStorage.getItem(`cachedBlocksPage_${currentPage}`);
    if (cachedBlocks) {
        const blocks = JSON.parse(cachedBlocks);
        appendBlocksToTable(blocks);
    } else {
        fetchRecentBlocks();
    }
}

// Append the blocks to the table
function appendBlocksToTable(blocks) {
    const recentBlocksTable = document.getElementById('recent-blocks');
    blocks.forEach(block => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700';

        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.block_number}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${new Date(block.timestamp * 1000).toLocaleString()}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.transactions}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.miner}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.baseFeePerGas}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.gasLimit}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">${block.gasUsed}</td>
            <td class="px-6 py-4 font-medium text-xs text-gray-900 whitespace-nowrap dark:text-white">
                <a 
                    class="font-medium text-blue-600 dark:text-sky-700 hover:underline"
                    href="/block/${block.block_number}" 
                >
                    View Details
                </a>
            </td>
        `;
        recentBlocksTable.appendChild(row);
    });
}