// Canvas setup
const canvas = document.getElementById('heatmap-canvas');
const ctx = canvas.getContext('2d');

// Debounce function for better perfromance
function debounce(func, wait) {
    let timeout;

    return function executedFunc(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        }
        clearTimeout(timeout);
        setTimeout(later, wait);
    }
}

// Throttle function for mouse events
function throttle(func, limit) {
    let inThrottle;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit)
        }
    }
}


// Resize canvas to match map container
function resizeCanvas() {
    try {
        const mapContainer = document.getElementById("map");

        if (mapContainer.style.display === "none" || mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
            console.log("Map container is not visible");
            return;
        }

        const rect = mapContainer.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    }
    catch (e) {
        console.error("Error resizing canvas: ", e)
    }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Setting Cache Details for Local Storage
const CACHE_KEY = "houseData";
const CACHE_TIME_KEY = "houseDataTimestamp";
const MAX_CACHE_AGE = 120000; // 6 hours

// Flag to track if map is ready
let mapReady = false;

// Initializing the map
let map;
function initializeMap(lat, lon) {
    // Detecting if it's a mobile device
    const isMobile = window.innerWidth <= 768;

    map = L.map('map', {
        dragging: true,
        scrollWheelZoom: !isMobile,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
        touchZoom: true,
        zoomControl: false,
        minZoom: 5,
        maxZoom: 9,
        // Better mobile performance
        preferCanvas: true,
        updateWhenIdle: isMobile,
        updateWhenZooming: !isMobile,
        keepBuffer: isMobile ? 1 : 2
    }).setView([lat, lon], 6);

    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 1,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 2,
        errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    }).addTo(map);

    // Waiting for tiles to load before drawing heat points
    tileLayer.on('load', () => {
        if (!mapReady) {
            mapReady = true;
            // Ensure canvas is properly sized and then draw heat points
            setTimeout(() => {
                resizeCanvas();
                map.invalidateSize();
                drawAllHeatPoints();
            }, 100);
        }
    });

    // Also triggering on map ready event as backup
    map.whenReady(() => {
        setTimeout(() => {
            mapReady = true;
            resizeCanvas();
            drawAllHeatPoints();
        }, 200);
    });

    // Drawing heat ponint by debouncing
    const debouncedDraw = debounce(drawAllHeatPoints, 100);
    map.on("move", debouncedDraw);
    map.on("zoom", debouncedDraw);
    map.on("moveend", drawAllHeatPoints);
    map.on("zoomend", drawAllHeatPoints);

    // Handling map resize
    map.on("resize", () => {
        resizeCanvas();
        drawAllHeatPoints();
    })

    // Tooltip on hover - throttling for better performance
    const mapContainer = document.getElementById("map");
    const tooltip = document.getElementById('tooltip');
    let tooltipTimeout;

    const handleMouseMove = throttle((e) => {
        // Skip for mobile devices
        if ("ontouchstart" in window) return;

        const mapRect = map.getContainer().getBoundingClientRect();
        const mouseX = e.clientX - mapRect.left;
        const mouseY = e.clientY - mapRect.top;

        const hoverHouse = houseData.find(house => {
            const point = map.latLngToContainerPoint([house.lat, house.lon]);
            const dx = point.x - mouseX;
            const dy = point.y - mouseY;
            return Math.sqrt(dx * dx + dy * dy) < 15;
        });

        if (hoverHouse) {
            const toolTipWidth = 200;
            const toolTipHeight = 95;

            let leftPos = e.clientX + 15;
            let topPos = e.clientY + 15;

            if (leftPos + toolTipWidth > window.innerWidth) {
                leftPos = e.clientX - toolTipWidth - 15;
            }
            if (topPos + toolTipHeight > window.innerHeight) {
                topPos = e.clientY - toolTipHeight - 15;
            }

            if (leftPos < 0) {
                leftPos = toolTipWidth / 2;
            }
            if (topPos < 0) {
                topPos = toolTipHeight / 2;
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
            <strong>Price Change:</strong> ${hoverHouse.percentChange.toFixed(2)}% ${hoverHouse.percentChange > 0 ? "📈" : "📉"}<br>
            <strong>Latest Price:</strong> $${hoverHouse.currentPrice}
        `;
        } else {
            tooltip.style.display = 'none';
        }
    }, 50);

    mapContainer.addEventListener("mousemove", handleMouseMove);

    // Fixed mobile tooltip - use touchstart instead of click
    mapContainer.addEventListener("touchstart", (e) => {
        // Prevent default to avoid double triggering
        e.preventDefault();

        const touch = e.touches[0];
        const mapRect = map.getContainer().getBoundingClientRect();
        const touchX = touch.clientX - mapRect.left;
        const touchY = touch.clientY - mapRect.top;

        const hoverHouse = houseData.find(house => {
            const point = map.latLngToContainerPoint([house.lat, house.lon]);
            const dx = point.x - touchX;
            const dy = point.y - touchY;
            return Math.sqrt(dx * dx + dy * dy) < 20; // Slightly larger touch target
        });

        if (hoverHouse) {
            const toolTipWidth = 200;
            const toolTipHeight = 95;

            let leftPos = touch.clientX + 15;
            let topPos = touch.clientY + 15;

            if (leftPos + toolTipWidth > window.innerWidth) {
                leftPos = touch.clientX - toolTipWidth - 15;
            }
            if (topPos + toolTipHeight > window.innerHeight) {
                topPos = touch.clientY - toolTipHeight - 15;
            }

            if (leftPos < 0) {
                leftPos = toolTipWidth / 2;
                console.log("Hello I am width");
            }
            if (topPos < 0) {
                topPos = toolTipHeight / 2;
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <strong>Price Change:</strong> ${hoverHouse.percentChange.toFixed(2)}% ${hoverHouse.percentChange > 0 ? "📈" : "📉"}<br>
                <strong>Latest Price:</strong> $${hoverHouse.currentPrice}
            `;

            // Hide tooltip after 3 seconds on mobile
            if (tooltipTimeout) clearTimeout(tooltipTimeout);

            tooltipTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 3000);
        } else {
            tooltip.style.display = 'none';
        }
    });
}

// House data store
let houseData = [];
let totalPages = JSON.parse(localStorage.getItem("totalPages")) || null, currentPage = 1;
let maxHouseCardsToShow = 30;
let start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow, end = currentPage * maxHouseCardsToShow;

// Parse Date into Date object
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

// Calculate % change and last price from price history
function calculatePercentChange(pricesArray) {
    const parsed = pricesArray.map(p => {
        const [dateStr, priceStr] = p.split('|').map(x => x.trim());
        return { sortByDate: parseDate(dateStr), date: dateStr, price: parseInt(priceStr) };
    }).sort((a, b) => a.sortByDate - b.sortByDate);

    const first = parsed[0].price;
    const last = parsed[parsed.length - 1].price;

    if (first === 0) return { percentChange: 0, last };
    return { percentChange: ((last - first) / first) * 100, last, sortedPrices: parsed };
}

// Load house data from localstorage or fetch
let mapInitialized = false, isFirstLoad = true;
function loadHouseData() {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) <= MAX_CACHE_AGE) {
        try {
            const data = JSON.parse(cached);

            let lat = 0, lon = 0;
            houseData = data.map(house => {
                lat += house.lat;
                lon += house.lon;

                const { percentChange, last, sortedPrices } = calculatePercentChange(house.prices);

                return { ...house, percentChange, currentPrice: last, sortedPrices };
            })

            lat /= houseData.length;
            lon /= houseData.length;

            if (!mapInitialized) {
                initializeMap(lat, lon);
                mapInitialized = true;
            }
            else {
                map.setView([lat, lon], map.getZoom());
                drawAllHeatPoints();
            }

            showHouses(start, end);

            // Calling pagination and footer
            addPagination();
            addFooter();
        }
        catch (error) {
            console.error("Error parsing cached data: ", error);
            fetchFreshData(currentPage);
        }
    }
    else {
        fetchFreshData(currentPage);
    }

}

// Fetch fresh house data
function fetchFreshData(page) {
    if (isFirstLoad) {
        const now = Date.now();

        // Calling fetch
        fetch(`https://estate-insight-backend.onrender.com/api/houses?limit=300`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(fullObj => {
                totalPages = Math.ceil(parseInt(fullObj.count) / maxHouseCardsToShow);
                const data = fullObj.data;

                let lat = 0, lon = 0;
                houseData = data.map(house => {
                    lat += house.lat;
                    lon += house.lon;
                    const { percentChange, last, sortedPrices } = calculatePercentChange(house.prices);
                    return { ...house, percentChange, currentPrice: last, sortedPrices };
                });

                lat /= houseData.length;
                lon /= houseData.length;

                // Initialize the map on first load
                if (!mapInitialized) {
                    initializeMap(lat, lon);
                    mapInitialized = true;
                }
                else {
                    map.setView([lat, lon], map.getZoom());
                    drawAllHeatPoints();
                }

                showHouses(start, end);

                // Calling pagination
                addPagination();

                // Call footer on the first load
                if (page === 1) {
                    addFooter();
                }

                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                    localStorage.setItem(CACHE_TIME_KEY, now.toString());
                    localStorage.setItem("totalPages", totalPages.toString());
                }
                catch (e) {
                    console.warn("Failed to cache data: ", e);
                }
            })
            .catch(err => {
                console.error('Error fetching house data:', err);

                if (!mapInitialized) {
                    addFooter();
                }
            })
            .finally(() => isFirstLoad = false)
    }
    else {
        // then do the map api call or something right???
    }
}


// Optimized draw function with requestAnimationFrame
let drawAnimationFrame = null;
function drawAllHeatPoints() {
    // Don't draw if map is not ready
    if (!mapReady || !map || !houseData || houseData.length === 0) return;

    if (drawAnimationFrame) {
        cancelAnimationFrame(drawAnimationFrame);
    }

    drawAnimationFrame = requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const points = [];

        houseData.forEach(currentHouse => {
            const currentPoint = map.latLngToContainerPoint([currentHouse.lat, currentHouse.lon]);

            if (currentPoint.x < -50 || currentPoint.x > canvas.width + 50 || currentPoint.y < -50 || currentPoint.y > canvas.height + 50) {
                return;
            }

            points.push({
                x: currentPoint.x,
                y: currentPoint.y,
                change: currentHouse.percentChange,
                listingType: currentHouse.listingType
            });
        });

        // Draw all points
        points.forEach(point => {
            const radius = 5;
            const color = getInterpolatedColor(point.change, point.listingType);

            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

// Handling window resize with debouncing
const handleResize = debounce(() => {
    resizeCanvas();

    if (map) {
        map.invalidateSize();
        drawAllHeatPoints();
    }
}, 250);

window.addEventListener("resize", handleResize);

// Color scale
function getInterpolatedColor(change, listingType) {
    if (listingType === "Sold") {
        return { r: 40, g: 40, b: 40 };
    }
    if (change <= -80) return { r: 160, g: 0, b: 0 };
    if (change <= -20) return { r: 233, g: 62, b: 58 };
    if (change < 0) return { r: 255, g: 165, b: 0 };
    if (change <= 20) return { r: 255, g: 215, b: 0 };
    if (change <= 60) return { r: 144, g: 238, b: 144 };
    if (change <= 100) return { r: 27, g: 138, b: 90 };
    return { r: 0, g: 255, b: 0 };
}


// House Showing Function
function showHouses(startIdx, endIdx) {
    const houseListings = document.querySelector(".house-listings");
    houseListings.innerHTML = ``;
    let demoHtml = ``;

    houseData.slice(startIdx, endIdx).forEach((house, idx) => {
        // Sort historical prices in ascending order
        const length = house.sortedPrices.length;

        // Number of cards showing
        const showingInfo = document.querySelector(".showing-info");
        showingInfo.innerHTML = `Showing ${startIdx + 1} - ${endIdx} of ${houseData.length} houses`;
        
        // Generating prices history
        const priceHistoryHTML = `
            <li><span class="hist-date">${house.sortedPrices[0].date}</span> <span class="colon">:</span> <span class="hist-price">$${house.sortedPrices[0].price}</span></li>
        
            <li><span class="hist-date">${house.sortedPrices[length - 1].date}</span> <span class="colon">:</span> <span class="hist-price">$${house.sortedPrices[length - 1].price}</span></li>
        `;

        const priceChangeText = house.percentChange > 0 ? `<span class='increase'>⬆ ${house.percentChange.toFixed(2)}%</span>` : `<span class='decrease'>⬇ ${house.percentChange.toFixed(2)}%</span>`

        demoHtml += `
            <div class="house-card" data-index="${idx}">
                <img class="house-img" src="./images/house_image.webp" alt="House Image" />
                <div class="house-content">
                    <h2 class="price">$${house.currentPrice.toLocaleString()} <p class="price-change">${priceChangeText}</p></h2>
                    <div class="info">
                        <p><span>${house.beds}</span> Bed${house.beds > 1 ? 's' : ''}</p> | 
                        <p><span>${house.baths}</span> Bath${house.baths > 1 ? 's' : ''}</p> | 
                        <p><span>${house.sizeSqft}</span> sqft</p> |
                        <p><span>${house.listingType}</span></p>
                    </div>
                    <p class="address">${house.address}</p>
                    <hr />
                    <ul class="historical-prices">${priceHistoryHTML}</ul>
                    <hr />
                    <button class="details-btn">Details</button>
                </div>
            </div>
        `;
    })

    houseListings.innerHTML = demoHtml;

    // Re-attach event listeners after creating the house cards
    attachHouseCardListeners();
}

// Separate function to attach event listeners
function attachHouseCardListeners() {
    document.querySelectorAll(".house-card").forEach(card => {
        const detailsBtn = card.querySelector(".details-btn");

        detailsBtn.addEventListener("click", () => {
            const idx = parseInt(card.getAttribute("data-index"));
            const house = houseData[idx];

            openHouseDetails(house);
        })
    });
}


function openHouseDetails(house) {
    document.body.classList.add("modal-open");

    const modal = document.getElementById("house-details-modal");
    const details = document.getElementById("house-details-content");

    const sortedPrices = house.prices.map(price => {
        const [dateStr, priceStr] = price.split(" | ");
        return {
            sortByDate: parseDate(dateStr),
            date: dateStr,
            price: parseInt(priceStr)
        };
    }).sort((a, b) => a.sortByDate - b.sortByDate);


    const priceHistoryHTML = sortedPrices.map(item => {
        const { date, price } = item;
        return `<li><strong>${date}</strong> $${price.toLocaleString()}</li>`;
    })
        .join("");

    details.innerHTML = `
    <div class="house-details-wrapper">
    
      <img class="house-details-img" src="./images/house_image.webp" alt="House Image" />

      <div class="price">$${house.currentPrice.toLocaleString()}</div>

      <h2 class="address">${house.address}</h2>

      <div class="house-info">
        <div><strong>Beds:</strong> ${house.beds}</div>
        <div><strong>Baths:</strong> ${house.baths}</div>
        <div><strong>Size:</strong> ${house.sizeSqft} sqft</div>
        <div><strong>Year Built:</strong> ${house.yearBuilt}</div>
        <div><strong>Home Type:</strong> ${house.homeType}</div>
        <div><strong>Garage:</strong> ${house.garage ? "Yes" : "No"}</div>
        <div><strong>Garden:</strong> ${house.garden ? "Yes" : "No"}</div>
        <div><strong>Status:</strong> ${house.listingType}</div>
      </div>


      <section class="price-history-section">
        <h3>Price History</h3>
        <ul class="price-history-list">${priceHistoryHTML}</ul>
      </section>

      <section class="description-section">
        <h3>Description</h3>
        <p>${house.description || "No description provided."}</p>
      </section>
    </div>
  `;

    modal.classList.remove("hidden");

    // Close modal when clicking outside content
    modal.onclick = (e) => {
        if (e.target === modal) {
            setTimeout(closeHouseDetails, 150);
        }
    };

    // Close modal with button
    document.getElementById("modal-close-btn").onclick = () => setTimeout(closeHouseDetails, 150);
}

function closeHouseDetails() {
    document.body.classList.remove("modal-open");
    const modal = document.getElementById("house-details-modal");
    modal.classList.add("hidden");
}

let isPaginatinInitialized = false;

function addPagination() {
    if (totalPages > 0) {
        if (!isPaginatinInitialized) {
            createPagination();
            isPaginatinInitialized = true;
        }
        else {
            updatePagination();
        }
    }
}

function createPagination() {
    const paginationContainer = document.querySelector(".pagination");
    const pageNumbers = document.querySelector(".page-numbers");

    paginationContainer.style.display = "flex";
    pageNumbers.innerHTML = "";

    const visiblePages = calculateVisiblePages(currentPage, totalPages);

    visiblePages.forEach(page => {
        if (page === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.innerHTML = "...";
            ellipsis.classList.add("pagination-ellipsis");
            pageNumbers.appendChild(ellipsis);
        }
        else {
            const pageButton = document.createElement("button");
            pageButton.innerHTML = page;
            pageButton.classList.add("page-number-btn");
            pageButton.setAttribute("data-index", page);

            if (currentPage === page) {
                pageButton.classList.add("active");
            }

            pageNumbers.appendChild(pageButton);
        }
    })

    // adding event listeners to page buttons
    document.querySelectorAll(".page-number-btn").forEach(pageButton => {
        pageButton.addEventListener("click", () => {
            const pageNumber = parseInt(pageButton.getAttribute("data-index"));
            if (currentPage !== pageNumber) {
                currentPage = pageNumber;
                start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow;
                end = currentPage * maxHouseCardsToShow;
                showHouses(start, end);
                updatePagination();
            }
        })
    })

    // adding event listeners for prev button
    document.querySelector(".prev").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow;
            end = currentPage * maxHouseCardsToShow;
            showHouses(start, end);
            updatePagination();
        }
    })

    // adding event listener for next button
    document.querySelector(".next").addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow;
            end = currentPage * maxHouseCardsToShow;
            showHouses(start, end);
            updatePagination();
        }
    })
}

function updatePagination() {
    const pageNumbers = document.querySelector(".page-numbers");

    pageNumbers.innerHTML = "";

    const visiblePages = calculateVisiblePages(currentPage, totalPages);


    visiblePages.forEach(page => {
        if (page === "...") {
            const ellipsis = document.createElement("span");
            ellipsis.innerHTML = "...";
            ellipsis.classList.add("pagination-ellipsis");
            pageNumbers.appendChild(ellipsis);
        }
        else {
            const pageButton = document.createElement("button");
            pageButton.innerHTML = page;
            pageButton.classList.add("page-number-btn");
            pageButton.setAttribute("data-index", page);

            if (currentPage === page) {
                pageButton.classList.add("active");
            }

            pageNumbers.appendChild(pageButton);
        }
    });

    document.querySelectorAll(".page-number-btn").forEach(pageButton => {
        pageButton.addEventListener("click", () => {
            const pageNumber = parseInt(pageButton.getAttribute("data-index"));

            if (currentPage !== pageNumber) {
                currentPage = pageNumber;
                start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow;
                end = currentPage * maxHouseCardsToShow;
                showHouses(start, end);
                updatePagination();
            }
        })
    })

    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

function calculateVisiblePages(currentPage, totalPages) {
    const pagesToShowBeforeAfter = 1;
    const windowSize = pagesToShowBeforeAfter * 2 + 1;
    const hold = totalPages - windowSize;

    const pages = [];

    pages.push(1);

    // If the pages are less than the max to show
    if (totalPages <= 5) {
        for (let i = 2; i <= totalPages; i++) pages.push(i);
        return pages;
    }

    // When we are near the start part
    if (currentPage <= windowSize) {
        for (let i = 2; i <= windowSize + 1; i++) {
            pages.push(i);
        }
        pages.push("...");
    }
    // When we are near the end part
    else if (currentPage >= hold) {
        pages.push("...");
        for (let i = hold; i <= totalPages - 1; i++) {
            pages.push(i);
        }
    }
    // When we are in the middle part
    else {
        pages.push("...");

        for (let i = currentPage - pagesToShowBeforeAfter; i <= currentPage + pagesToShowBeforeAfter; i++) {
            pages.push(i);
        }

        pages.push("...");
    }

    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return pages;
}

function addFooter() {
    const footer = document.querySelector("footer");
    footer.style.display = "block";
}

// Initialize on DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        loadHouseData();
    });
}
else {
    loadHouseData();
}