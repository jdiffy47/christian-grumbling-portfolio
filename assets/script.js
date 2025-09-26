// Update current year in footer
function updateYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Set active navigation link
function setActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.removeAttribute('aria-current');
        const linkPath = new URL(link.href).pathname;

        // Handle root path
        if (currentPath === '/' && linkPath === '/') {
            link.setAttribute('aria-current', 'page');
        } else if (currentPath !== '/' && linkPath !== '/' && currentPath.includes(linkPath.replace('.html', ''))) {
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Render projects from JSON data
async function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;

    try {
        const response = await fetch('/data/projects.json');
        if (!response.ok) throw new Error('Failed to fetch projects');

        const projects = await response.json();

        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p>No projects available yet. Check back soon!</p>';
            return;
        }

        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card">
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.description)}</p>
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${project.link && project.link !== '#' ? `<a href="${escapeHtml(project.link)}" target="_blank" rel="noopener">View Project</a>` : ''}
                    ${project.source && project.source !== '#' ? `<a href="${escapeHtml(project.source)}" target="_blank" rel="noopener">Source Code</a>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsGrid.innerHTML = '<p>Unable to load projects. Please try again later.</p>';
    }
}

// Render learning entries from JSON data
async function renderLearning() {
    const learningList = document.getElementById('learning-list');
    if (!learningList) return;

    try {
        const response = await fetch('/data/learning.json');
        if (!response.ok) throw new Error('Failed to fetch learning data');

        const learningEntries = await response.json();

        if (learningEntries.length === 0) {
            learningList.innerHTML = '<p>No learning entries yet. Check back soon!</p>';
            return;
        }

        // Sort by week (newest first - assuming higher week numbers are newer)
        const sortedEntries = learningEntries.sort((a, b) => {
            const weekA = parseInt(a.week.replace(/\D/g, ''));
            const weekB = parseInt(b.week.replace(/\D/g, ''));
            return weekB - weekA;
        });

        learningList.innerHTML = sortedEntries.map((entry, index) => `
            <div class="learning-entry" data-index="${index}">
                <div class="learning-entry-header">
                    <label class="learning-checkbox">
                        <input type="checkbox" class="learning-checkbox-input">
                        <span class="learning-checkbox-custom"></span>
                    </label>
                    <h3>${escapeHtml(entry.week)}</h3>
                </div>
                <p>${escapeHtml(entry.note)}</p>
            </div>
        `).join('');

        // Add event listeners for checkboxes
        attachLearningCheckboxHandlers();
    } catch (error) {
        console.error('Error loading learning data:', error);
        learningList.innerHTML = '<p>Unable to load learning entries. Please try again later.</p>';
    }
}

// Attach contact form handler
function attachContactFormHandler() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check honeypot
        const honeypot = form.querySelector('.hp');
        if (honeypot && honeypot.value) {
            return; // Bot detected, silently ignore
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Sending…';

        // Clear any existing notices
        const noticesContainer = document.getElementById('contact-notices');
        if (noticesContainer) {
            noticesContainer.innerHTML = '';
        }

        try {
            const formData = new FormData(form);

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success - replace form with success message
                const successNotice = document.createElement('div');
                successNotice.className = 'notice success';
                successNotice.innerHTML = `
                    <h3>Message Sent!</h3>
                    <p>Thank you for your message. I'll get back to you soon.</p>
                `;
                successNotice.setAttribute('tabindex', '-1');

                form.parentNode.replaceChild(successNotice, form);
                successNotice.focus();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);

            // Show error notice
            const errorNotice = document.createElement('div');
            errorNotice.className = 'notice error';
            errorNotice.setAttribute('aria-live', 'polite');
            errorNotice.innerHTML = `
                <h3>Error Sending Message</h3>
                <p>There was a problem sending your message. Please try again or email me directly.</p>
            `;

            if (noticesContainer) {
                noticesContainer.appendChild(errorNotice);
            } else {
                form.parentNode.insertBefore(errorNotice, form);
            }

            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Attach learning checkbox handlers
function attachLearningCheckboxHandlers() {
    const checkboxes = document.querySelectorAll('.learning-checkbox-input');

    checkboxes.forEach(checkbox => {
        // Load saved state from localStorage
        const entryIndex = checkbox.closest('.learning-entry').dataset.index;
        const savedState = localStorage.getItem(`learning-${entryIndex}`);
        if (savedState === 'true') {
            checkbox.checked = true;
            checkbox.closest('.learning-entry').classList.add('completed');
        }

        checkbox.addEventListener('change', function() {
            const entry = this.closest('.learning-entry');
            const isChecked = this.checked;

            if (isChecked) {
                entry.classList.add('completed');
            } else {
                entry.classList.remove('completed');
            }

            // Save state to localStorage
            localStorage.setItem(`learning-${entryIndex}`, isChecked.toString());
        });
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add fun interactive effects
function addInteractiveEffects() {
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const text = heroTitle.textContent;
        // Reserve space by setting min-height
        heroTitle.style.minHeight = heroTitle.offsetHeight + 'px';
        heroTitle.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };

        setTimeout(typeWriter, 1000);
    }

    // Add floating particles effect
    createFloatingParticles();

    // Add hover sound effects (visual feedback)
    addHoverEffects();
}

// Create floating particles
function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Only create particles on the home page
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && !currentPath.includes('index.html')) {
        return;
    }

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--accent);
            border-radius: 50%;
            opacity: 0;
            animation: floatParticle ${3 + Math.random() * 4}s linear infinite;
            left: ${Math.random() * 90 + 5}%;
            top: 100%;
            animation-delay: ${Math.random() * 3}s;
        `;
        hero.appendChild(particle);
    }
}

// Add hover effects to interactive elements
function addHoverEffects() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Mobile navigation toggle
function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile nav when clicking on a link
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close mobile nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateYear();
    setActiveNav();
    addInteractiveEffects();
    initMobileNav();

    // Load dynamic content based on current page
    const currentPath = window.location.pathname;

    if (currentPath.includes('projects.html')) {
        renderProjects();
    } else if (currentPath.includes('learning.html')) {
        renderLearning();
    }
});

// Handle navigation changes for SPA-like behavior (if needed)
window.addEventListener('popstate', function() {
    setActiveNav();
});
