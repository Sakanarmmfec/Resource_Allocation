// Hamburger menu component for Resource Allocation System
function createHamburgerMenu() {
    const menuHTML = `
        <div class="hamburger-menu" style="
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1002;
        ">
            <button class="hamburger-btn" id="hamburgerBtn" onclick="toggleMenu()" style="
                background: #2563eb !important;
                border: none !important;
                border-radius: 6px !important;
                padding: 12px !important;
                cursor: pointer !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                margin: 0 !important;
                font-size: 14px !important;
                width: auto !important;
                height: auto !important;
            " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                <div class="hamburger-icon" style="
                    width: 20px;
                    height: 14px;
                    position: relative;
                ">
                    <span style="
                        display: block;
                        height: 2px;
                        width: 100%;
                        background: white;
                        margin-bottom: 3px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    "></span>
                    <span style="
                        display: block;
                        height: 2px;
                        width: 100%;
                        background: white;
                        margin-bottom: 3px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    "></span>
                    <span style="
                        display: block;
                        height: 2px;
                        width: 100%;
                        background: white;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    "></span>
                </div>
            </button>
            
            <div class="menu-dropdown" id="menuDropdown" style="
                position: fixed;
                top: 0;
                left: -280px;
                width: 280px;
                height: 100vh;
                background: #ffffff;
                transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1001;
                overflow-y: auto;
                font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <div style="
                    background: #f8fafc;
                    color: #1e293b;
                    padding: 24px 20px;
                    font-weight: 600;
                    font-size: 18px;
                    border-bottom: 1px solid #e2e8f0;
                ">Menu</div>
                
                <a href="index.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                    <span>Home</span>
                </a>
                
                <a href="workload-summary.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>
                    <span>Analytics</span>
                </a>
                
                <a href="add-department.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd"/></svg>
                    <span>Departments</span>
                </a>
                
                <a href="add-employee.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
                    <span>Employees</span>
                </a>
                
                <a href="add-project.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                    <span>Projects</span>
                </a>
                
                <a href="project-mapping.html" class="menu-item" style="
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 15px;
                " onmouseover="this.style.background='#f1f5f9'; this.style.color='#2563eb'" onmouseout="this.style.background=''; this.style.color='#475569'">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/></svg>
                    <span>Mapping</span>
                </a>
            </div>
        </div>
        
        <div class="menu-backdrop" id="menuBackdrop" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        " onclick="toggleMenu()"></div>
    `;
    
    return menuHTML;
}

function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    const backdrop = document.getElementById('menuBackdrop');
    const isOpen = dropdown.style.left === '0px';
    
    if (isOpen) {
        dropdown.style.left = '-280px';
        backdrop.style.display = 'none';
    } else {
        dropdown.style.left = '0px';
        backdrop.style.display = 'block';
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.querySelector('.hamburger-menu');
    const dropdown = document.getElementById('menuDropdown');
    const backdrop = document.getElementById('menuBackdrop');
    
    if (menu && dropdown && !menu.contains(event.target)) {
        dropdown.style.left = '-280px';
        if (backdrop) backdrop.style.display = 'none';
    }
});

// Function to insert hamburger menu
function insertHamburgerMenu() {
    const menu = createHamburgerMenu();
    document.body.insertAdjacentHTML('afterbegin', menu);
    
    // Highlight current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const itemPage = item.getAttribute('href');
        if (itemPage === currentPage) {
            item.style.background = '#e0f2fe';
            item.style.fontWeight = '600';
            item.style.borderLeft = '4px solid #1e3a8a';
        }
    });
}

// Auto-insert hamburger menu when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    insertHamburgerMenu();
});