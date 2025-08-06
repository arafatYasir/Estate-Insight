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
            if(d !== dropdown) d.classList.remove("active");
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
