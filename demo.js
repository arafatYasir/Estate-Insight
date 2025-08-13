


// House Showing Function
function showHouses(startIdx, endIdx) {
    const houseListings = document.querySelector(".house-listings");
    houseListings.innerHTML = ``;

    houseData.slice(startIdx, endIdx).forEach((house, idx) => {
        // Sort historical prices in ascending order
        const length = house.sortedPrices.length;

        // Generating prices history
        const priceHistoryHTML = `
            <li><span class="hist-date">${house.sortedPrices[0].date}</span> <span class="colon">:</span> <span class="hist-price">$${house.sortedPrices[0].price}</span></li>
        
            <li><span class="hist-date">${house.sortedPrices[length - 1].date}</span> <span class="colon">:</span> <span class="hist-price">$${house.sortedPrices[length - 1].price}</span></li>
        `;

        const priceChangeText = house.percentChange > 0 ? `<span class='increase'>⬆ ${house.percentChange.toFixed(2)}%</span>` : `<span class='decrease'>⬇ ${house.percentChange.toFixed(2)}%</span>`

        houseListings.innerHTML += `
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

    // Re-attach event listeners after creating the house cards
    attachHouseCardListeners();
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