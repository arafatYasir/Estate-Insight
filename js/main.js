// Event listener to show mobile menu options
let menuBtn = document.querySelector(".menu-btn");
let searchIconBtn = document.querySelector(".search-icon-btn");
let crossBtn = document.querySelector(".cross");
let backBtn = document.querySelector(".back-btn");
let logo = document.querySelector(".logo");
let navOptions2 = document.querySelector(".nav-options2");
let searchBox = document.querySelector(".search-box");
let mobileSpecialNav = document.querySelector(".mobile-special-nav");
let filterDropdowns = document.querySelectorAll(".custom-dropdown");

// Event listener to close dropdowns on the click of outside the box
window.addEventListener("click", (e) => {
    filterDropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    })
})

// Responsive Navbar
menuBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(0%)";
})

crossBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(-100%)";
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
        })
    })
})


// Mobile Filter Dropdowns
const mobileFilterBtn = document.querySelector(".mobile-filter-btn");
const filterModal = document.querySelector(".filter-modal");
const filterOverlay = document.querySelector(".filter-modal-overlay");

let startY, currentY, isDragging = false;

mobileFilterBtn.addEventListener("click", () => {
    filterOverlay.style.display = "block";
    setTimeout(() => {
        filterModal.classList.add("show");
        mobileFilterBtn.style.display = "none";
    }, 10);
});

// Drag Down to Close
filterModal.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
});

filterModal.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) {
        filterModal.style.transform = `translateY(${deltaY}px)`;
    }
});

filterModal.addEventListener("touchend", () => {
    isDragging = false;

    // If user didn’t move finger enough, do nothing
    if (typeof currentY !== "number") {
        filterModal.style.transform = "";
        return;
    }

    const deltaY = currentY - startY;

    if (deltaY > 120) {
        closeFilterModal();
    } else {
        filterModal.style.transform = "";
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
    filterModal.classList.remove("show");
    filterModal.style.transform = "";
    filterOverlay.style.display = "none";
    mobileFilterBtn.style.display = "block";
}
