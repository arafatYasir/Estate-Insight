// Elements to show mobile menu options
let menuBtn = document.querySelector(".menu-btn");
let searchIconBtn = document.querySelector(".search-icon-btn");
let crossBtn = document.querySelector(".cross");
let backBtn = document.querySelector(".back-btn");
let logo = document.querySelector(".logo");
let navOptions2 = document.querySelector(".nav-options2");
let searchBox = document.querySelector(".search-box");
let mobileSpecialNav = document.querySelector(".mobile-special-nav");
let filterDropdowns = document.querySelectorAll(".custom-dropdown");

// Event listener to close things when clicked outside of it
let isNavOpen = false;

window.addEventListener("click", (e) => {
    filterDropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });

    if (isNavOpen && !navOptions2.contains(e.target)) {
        navOptions2.style.transform = "translateX(-100%)";
        isNavOpen = false;
    }

})

// Responsive Navbar
menuBtn.addEventListener("click", (e) => {
    navOptions2.style.transform = "translateX(0%)";
    isNavOpen = true;
    e.stopPropagation();
})

crossBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(-100%)";
    isNavOpen = false;
})

searchIconBtn.addEventListener("click", () => {
    searchBox.style.display = "flex";
    searchBox.style.gap = "10px"
    searchBox.style.justifyContent = "start";
    mobileSpecialNav.style.display = "none";
})

backBtn.addEventListener("click", () => {
    searchBox.style.display = "none";
    mobileSpecialNav.style.display = "flex";
})



// Custom Filter Dropdowns
filterDropdowns.forEach(dropdown => {
    const selected = dropdown.querySelector(".custom-dropdown-selected");
    const options = dropdown.querySelector(".custom-dropdown-options");

    selected.addEventListener("click", () => {
        // Closing other dropdowns
        document.querySelectorAll(".custom-dropdown").forEach(d => {
            if (d !== dropdown) d.classList.remove("active");
        });
        dropdown.classList.toggle("active");
    })

    options.querySelectorAll("li").forEach(option => {
        option.addEventListener("click", () => {
            selected.innerHTML = option.innerHTML;
            dropdown.classList.remove("active");
            dropdown.setAttribute("data-selected", option.dataset.value);

            // calling api when dropdown changes
            fetchHousesForCurrentBounds();
        })
    })
})


// Mobile Filter Dropdowns
const mobileFilterBtn = document.querySelector(".mobile-filter-btn");
const filterModal = document.querySelector(".filter-modal");
const filterOverlay = document.querySelector(".filter-modal-overlay");
const dragBarContainer = document.querySelector('.drag-bar-container');

let startY, currentY, isDragging = false;

let isAnimating = false;

mobileFilterBtn.addEventListener("click", () => {
    if (isAnimating) return;

    isAnimating = true;
    filterModal.style.transform = "";
    filterOverlay.style.display = "block";

    setTimeout(() => {
        filterModal.classList.add("show");
        document.body.classList.add("modal-open");
    }, 10);

    // Reset flag after animation finishes
    setTimeout(() => {
        isAnimating = false;
    }, 300);
});


// Drag Down to Close
dragBarContainer.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
});

dragBarContainer.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) {
        filterModal.style.transform = `translateY(${deltaY}px)`;
    }
});

dragBarContainer.addEventListener("touchend", () => {
    isDragging = false;

    // If user didn’t move finger enough, do nothing
    if (typeof currentY !== "number") {
        filterModal.style.transform = "";
        return;
    }

    const deltaY = currentY - startY;

    const threshold = filterModal.offsetHeight * 0.25; // 25% of modal height

    if (deltaY > threshold) {
        closeFilterModal();

    } else {
        filterModal.style.transition = "transform 0.2s ease";

        filterModal.style.transform = "";

        setTimeout(() => {
            filterModal.style.transition = "";
        }, 200);
    }

    // Reset for next interaction
    currentY = undefined;
});


// Close when clicking outside the drawer
filterOverlay.addEventListener("click", (e) => {
    if (e.target === filterOverlay) {
        closeFilterModal();
    }
});

// Close function for modal
function closeFilterModal() {
    if (isAnimating) return;
    isAnimating = true;

    filterModal.classList.remove("show");

    setTimeout(() => {
        filterOverlay.style.display = "none";
        document.body.classList.remove("modal-open");
        isAnimating = false;
    }, 300);
}

// Map refreshing function
function forceMapRefresh() {
    if (!map || !mapInitialized) return;

    setTimeout(() => {
        map.invalidateSize(true);

        resizeCanvas();

        const currentCenter = map.getCenter();

        map.panTo([currentCenter.lat + 0.0001, currentCenter.lng + 0.0001]);

        setTimeout(() => {
            map.panTo(currentCenter);
            drawAllHeatPoints();
        }, 50);
    }, 100);
}


// Switching from map to list for mobile and tablet
const realMap = document.querySelector("#map");
const houseContainer = document.querySelector(".house-container");
const switchToListBtn = document.querySelector(".switch-to-list");
const switchToMapBtn = document.querySelector(".switch-to-map");
const tooltip = document.getElementById('tooltip');
let showingState = localStorage.getItem("showingState") || "";
let switchEventListenersAdded = false;

function changeLayout() {
    // Checking if already state exists
    if (window.innerWidth <= 768) {
        if (localStorage.getItem("showingState") === "list") {
            realMap.style.display = "none";
            houseContainer.style.display = "block";
            switchToListBtn.style.display = "none";
            switchToMapBtn.style.display = "inline";
            mobileFilterBtn.style.display = "inline";
            tooltip.style.display = "none";
        }
        else if (localStorage.getItem("showingState") === "map") {
            realMap.style.display = "block";
            houseContainer.style.display = "none";
            switchToListBtn.style.display = "inline";
            switchToMapBtn.style.display = "none";
            mobileFilterBtn.style.display = "none";

            // Refresh the map
            forceMapRefresh();
        }


        if (!switchEventListenersAdded) {
            // Event listener to switch
            switchToListBtn.addEventListener("click", () => {
                realMap.style.display = "none";
                houseContainer.style.display = "block";
                switchToListBtn.style.display = "none";
                switchToMapBtn.style.display = "inline";
                mobileFilterBtn.style.display = "inline";
                tooltip.style.display = "none";

                localStorage.setItem("showingState", "list");
            })

            switchToMapBtn.addEventListener("click", () => {
                realMap.style.display = "block";
                houseContainer.style.display = "none";
                switchToListBtn.style.display = "inline";
                switchToMapBtn.style.display = "none";
                mobileFilterBtn.style.display = "none";

                localStorage.setItem("showingState", "map");

                // Refresh map
                forceMapRefresh();
            });

            switchEventListenersAdded = true;
        }
    }
    else {
        switchToListBtn.style.display = "none";
        switchToMapBtn.style.display = "none";
        mobileFilterBtn.style.display = "none";
        realMap.style.display = "block";
        houseContainer.style.display = "block";

        // Refresh map
        forceMapRefresh();
    }

}

// Initial layout change call
changeLayout();
window.addEventListener("resize", changeLayout);

const debouncedBoundsFetch = debounce(() => fetchHousesForCurrentBounds(), 400);

// ----Beds & Baths Custom Slider Range----
document.addEventListener("DOMContentLoaded", () => {
    function updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected, callAPI) {
        const beds = bedsSlider.value;
        const baths = bathsSlider.value;

        bedsValue.innerHTML = beds;
        bathsValue.innerHTML = baths;

        if (beds == 0 && baths == 0) {
            selected.innerHTML = "Any";
        }
        else {
            selected.innerHTML = `${beds} Bed${beds > 1 ? "s" : ""}, ${baths} Bath${baths > 1 ? "s" : ""}`;
        }

        if (callAPI) {
            // calling api with debounce
            debouncedBoundsFetch();
        }
    }

    function updateRangeFill(input) {
        const value = (input.value - input.min) / (input.max - input.min) * 100;
        input.style.background = `
            linear-gradient(to right,
            var(--accent-yellow) 0%,
            var(--accent-yellow) ${value}%,
            var(--background-light) ${value}%,
            var(--background-light) 100%)
        `;
    }

    const dropdownB = document.querySelectorAll('.custom-dropdown[data-name="bedsBaths"]');

    dropdownB.forEach(d => {
        const selected = d.querySelector(".custom-dropdown-selected");
        const bedsSlider = d.querySelector("#bedsRange");
        const bathsSlider = d.querySelector("#bathsRange");
        const bedsValue = d.querySelector("#bedsValue");
        const bathsValue = d.querySelector("#bathsValue");

        bedsSlider.addEventListener("input", () => updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected, true));
        bathsSlider.addEventListener("input", () => updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected, true));

        // Initial Call
        updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected, false);

        // Apply it to both sliders
        [bedsSlider, bathsSlider].forEach(slider => {
            updateRangeFill(slider);
            slider.addEventListener('input', () => updateRangeFill(slider));
        });
    })

    // ----Price Dropdown Custom Slider----
    function updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown, callAPI) {
        let minVal = parseInt(minInput.value);
        let maxVal = parseInt(maxInput.value);

        if (minVal > maxVal) {
            // Prevent crossing over
            [minInput.value, maxInput.value] = [maxVal, minVal];
            [minVal, maxVal] = [maxVal, minVal];
        }

        // Calculate percentage positions
        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;

        // Update fill bar
        fill.style.left = `${minPercent}%`;
        fill.style.width = `${maxPercent - minPercent}%`

        // Update value display
        minValueEl.innerHTML = `$${Number(minVal).toLocaleString()}`;
        maxValueEl.innerHTML = `$${Number(maxVal).toLocaleString()}`;
        selectedPriceDropdown.innerHTML = `$${parseInt(minVal).toLocaleString()} - $${parseInt(maxVal).toLocaleString()}`;

        if (callAPI) {
            // calling api with debounce
            debouncedBoundsFetch();
        }
    }

    const dropdownP = document.querySelectorAll('.custom-dropdown[data-name="pricePC"]');


    dropdownP.forEach(d => {
        const minInput = d.querySelector("#minPrice");
        const maxInput = d.querySelector("#maxPrice");
        const selectedPriceDropdown = d.querySelector(".custom-dropdown-selected");

        selectedPriceDropdown.innerHTML = `$${parseInt(minInput.value).toLocaleString()} - $${parseInt(maxInput.value).toLocaleString()}`;

        // Inject range-fill into the DOM dynamically
        const rangeWrapper = d.querySelector(".price-range-slider-wrapper");
        let fill = document.createElement("div");
        fill.classList.add("range-fill");
        rangeWrapper.appendChild(fill);


        const minValueEl = d.querySelector("#minPriceValue");
        const maxValueEl = d.querySelector("#maxPriceValue");

        const min = parseInt(minInput.min);
        const max = parseInt(maxInput.max);

        minInput.addEventListener("input", () => updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown, true));
        maxInput.addEventListener("input", () => updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown, true));

        // Initial update on load
        updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown, false);
    })
})


// Get all filter values
function getFilterValues() {
    const params = {};

    // getting dropdown values
    document.querySelectorAll(".custom-dropdown").forEach(dropdown => {
        const name = dropdown.getAttribute("data-name");
        const selectedValue = dropdown.querySelector(".custom-dropdown-selected").innerHTML;

        if (name && selectedValue) {
            switch (name) {
                case "listingType":
                    if (selectedValue !== "All") {
                        params.listingType = selectedValue;
                    }
                    break;
                case "homeType":
                    if (selectedValue !== "All") {
                        params.homeType = selectedValue;
                    }
                    break;
                case "sortBy":
                    // sortHouses(selectedValue);
                    break;
                // case "source":
                //     if(selectedValue !== "source1") {
                //         params.source = selectedValue;
                //     }
                //     break;
            }
        }

    });

    // Getting value of price ranges
    // Listen Arafat when the slider is changing both desktop and mobile slider is changing and mobile slider has the upper hand in this case and thats why it is not working. So you have to fix that.
    const priceDropdowns = document.querySelectorAll('.custom-dropdown[data-name="price"]');
    console.log("I am here at price");

    priceDropdowns.forEach(dropdown => {
        const minPrice = dropdown.querySelector("#minPrice");
        const maxPrice = dropdown.querySelector("#maxPrice");

        if (minPrice && maxPrice) {
            params.minPrice = minPrice.value;
            params.maxPrice = maxPrice.value;
            console.log("I am here too in side the condition where value is set // for debugging");
            console.log("Price values:", params.minPrice, params.maxPrice);
        }
    })

    // Getting value of beds & baths ranges
    const bedsDropdowns = document.querySelectorAll('.custom-dropdown[data-name="bedsBaths"]');

    bedsDropdowns.forEach(dropdown => {
        const beds = dropdown.querySelector('#bedsRange');
        const baths = dropdown.querySelector('#bathsRange');

        if (beds && baths) {
            if (beds.value !== "0") {
                params.beds = beds.value;
            }
            if (baths.value !== "0") {
                params.baths = baths.value;
            }
        }
    });

    return params;
}

// Sort by dropdown event listener
/// I was doing the sorting feature
// document.querySelector(".custom-dropdown[")


// function sortHouses(type) {
    
// }