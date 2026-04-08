// ============================================================
// Etgarim Karmiel-Misgav — Community Website
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSmoothScroll();
    initNavbarScroll();
    initScrollAnimations();
    initActiveNavLink();
    loadStories();
    initVolunteerForm();
});

// ── Mobile Menu ────────────────────────────────────────────
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        menu.classList.toggle('open');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.add('hidden');
            menu.classList.remove('open');
        });
    });
}

// ── Smooth Scroll ──────────────────────────────────────────
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 70; // navbar height
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// ── Navbar Scroll Effect ───────────────────────────────────
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled', 'shadow-md');
        } else {
            navbar.classList.remove('navbar-scrolled', 'shadow-md');
        }
    });
}

// ── Active Nav Link ────────────────────────────────────────
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px' });

    sections.forEach(section => observer.observe(section));
}

// ── Scroll Animations ──────────────────────────────────────
function initScrollAnimations() {
    // Add animation classes to elements
    const animateElements = [
        { selector: '#about .grid > div:first-child', class: 'fade-right' },
        { selector: '#about .grid > div:last-child', class: 'fade-left' },
        { selector: '#teams .grid', class: 'stagger-children' },
        { selector: '#schedule .grid', class: 'stagger-children' },
        { selector: '#inspiration h2', class: 'fade-up' },
        { selector: '#volunteer form', class: 'scale-in' },
        { selector: '#contact .grid', class: 'stagger-children' },
    ];

    animateElements.forEach(({ selector, class: cls }) => {
        const el = document.querySelector(selector);
        if (el) el.classList.add(cls);
    });

    // Also add fade-up to section headers
    document.querySelectorAll('section > div > .text-center').forEach(el => {
        if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
    });

    // Intersection Observer for triggering animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-up, .fade-right, .fade-left, .scale-in, .stagger-children').forEach(el => {
        observer.observe(el);
    });
}

// ── Stories / Inspiration Board ────────────────────────────
async function loadStories() {
    const container = document.getElementById('stories-container');
    if (!container) return;

    try {
        const res = await fetch('/api/stories');
        const stories = await res.json();

        if (!stories || stories.length === 0) {
            showDefaultStories(container);
            return;
        }

        renderStories(container, stories);
    } catch (e) {
        // Server not available, show defaults
        showDefaultStories(container);
    }
}

function showDefaultStories(container) {
    const defaults = [
        {
            title: 'מרוץ בשביל הגיבורות 2025',
            text: 'הקבוצה שלנו השתתפה במרוץ והוכיחה שכל צעד הוא ניצחון. גאים בכל אחד ואחת!',
            image: 'images/hands-together.jpeg',
            date: '2025-02-15'
        },
        {
            title: 'יום מרוץ בכרמיאל',
            text: 'מרוץ האביב של אתגרים — עשרות רצים ומתנדבים יצאו לדרך ביחד. אנרגיה מטורפת!',
            image: 'images/start-line.jpeg',
            date: '2025-01-20'
        },
        {
            title: 'גאווה כתומה',
            text: 'הקבוצה שלנו עם מדליות לאחר מרוץ מוצלח. כל אחד גיבור בדרך שלו.',
            image: 'images/medals-group.jpeg',
            date: '2024-12-10'
        }
    ];
    renderStories(container, defaults);
}

function renderStories(container, stories) {
    container.innerHTML = stories.map(story => `
        <div class="story-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            ${story.image ? `
                <div class="aspect-video overflow-hidden">
                    <img src="${story.image}" alt="${story.title}"
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                </div>
            ` : ''}
            ${story.embedUrl ? `
                <div class="aspect-video">
                    <iframe src="${story.embedUrl}" class="w-full h-full border-0" allowfullscreen loading="lazy"></iframe>
                </div>
            ` : ''}
            <div class="p-5">
                <div class="text-xs text-gray-400 mb-2">${formatDate(story.date)}</div>
                <h3 class="font-bold text-gray-900 text-lg mb-2">${story.title}</h3>
                <p class="text-gray-600 text-sm leading-relaxed">${story.text}</p>
                ${story.link ? `
                    <a href="${story.link}" target="_blank" rel="noopener"
                       class="inline-flex items-center gap-1 text-brand text-sm font-medium mt-3 hover:underline">
                        קראו עוד &larr;
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Animate story cards
    container.querySelectorAll('.story-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + i * 150);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

// ── Volunteer Form ─────────────────────────────────────────
function initVolunteerForm() {
    const form = document.getElementById('volunteer-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        const successDiv = document.getElementById('form-success');
        const errorDiv = document.getElementById('form-error');

        // Hide previous messages
        successDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');

        // Disable button
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'שולח...';
        btn.disabled = true;

        try {
            // Combine first + last name into a single 'name' field for the server
            if (data.firstName || data.lastName) {
                data.name = [data.firstName, data.lastName].filter(Boolean).join(' ');
            }

            const res = await fetch('/api/volunteer-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                successDiv.classList.remove('hidden');
                form.reset();
                successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            // No backend available (e.g. GitHub Pages) — show WhatsApp links directly
            successDiv.classList.remove('hidden');
            form.reset();
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}
