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
    initTestimonialsCarousel();
});

// ── Mobile Menu ────────────────────────────────────────────
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isOpen = !menu.classList.contains('hidden');
        menu.classList.toggle('hidden');
        menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        btn.setAttribute('aria-label', isOpen ? 'פתח תפריט ניווט' : 'סגור תפריט ניווט');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.add('hidden');
            menu.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'פתח תפריט ניווט');
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
            title: 'מירוץ תל אביב',
            text: 'אתגרים כרמיאל-משגב על קו הזינוק בתל אביב — יותר מ-9 שנים שאנחנו רצים יחד בעיר הגדולה. כל שנה מחדש, כל צעד הוא ניצחון.',
            image: 'images/start-line.jpeg',
            date: '2026-02-01'
        },
        {
            title: 'מירוץ בשביל הגיבורות',
            text: 'הקבוצה שלנו על המסלול — מתאמנים ומתנדבים יחד, כתף אל כתף. רגע שמזכיר לנו למה אנחנו עושים את זה.',
            image: 'images/hands-together.jpeg',
            date: '2025-12-01'
        },
        {
            title: 'מירוץ יוצא מן הכלל — כרמיאל',
            text: 'על המסלול הביתי בכרמיאל — אנרגיה, מדליות וחיוכים. הכתום עולה עולה!',
            image: 'images/medals-group.jpeg',
            date: '2024-06-01'
        }
    ];
    renderStories(container, defaults);
}

function renderStories(container, stories) {
    container.innerHTML = stories.map(story => `
        <article class="story-card group relative rounded-3xl overflow-hidden"
                 style="aspect-ratio:4/3"
                 aria-label="${story.text}">
            ${story.image ? `
                <img src="${story.image}" alt="" aria-hidden="true"
                     class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-focus-within:scale-110"
                     style="image-orientation:from-image">
            ` : ''}
            ${story.embedUrl ? `
                <iframe src="${story.embedUrl}" title="${story.text}"
                        class="absolute inset-0 w-full h-full border-0" allowfullscreen loading="lazy"></iframe>
            ` : ''}
            <!-- Gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                        transition-opacity duration-500 opacity-70 group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true"></div>
            <!-- Text — visible on hover/focus, always readable by screen reader -->
            <div class="absolute inset-x-0 bottom-0 p-5 translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-500 ease-out">
                <p class="text-white text-sm leading-relaxed opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 delay-100 mb-2"
                   aria-hidden="true">
                    ${story.text}
                </p>
                ${story.link ? `
                    <a href="${story.link}" target="_blank" rel="noopener"
                       aria-label="${story.text} — קראו עוד (נפתח בחלון חדש)"
                       class="inline-flex items-center gap-1 text-orange-300 text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 delay-150 hover:underline focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300 focus-visible:rounded">
                        קראו עוד ←
                    </a>
                ` : ''}
            </div>
            <!-- Always-visible text for screen readers -->
            <span class="sr-only">${story.text}</span>
            <!-- Orange dot indicator -->
            <div class="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-brand opacity-80" aria-hidden="true"></div>
        </article>
    `).join('');

    // Staggered entrance animation
    container.querySelectorAll('.story-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 150 + i * 120);
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

// ── Testimonials Carousel ──────────────────────────────────
function initTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    const dots = document.querySelectorAll('#testimonial-dots button');
    if (!track || !dots.length) return;

    let current = 0;
    const total = dots.length;

    function goTo(index) {
        current = index;
        track.style.transform = `translateX(${index * 100}%)`;
        dots.forEach((d, i) => {
            const span = d.querySelector('span');
            if (span) {
                span.classList.toggle('bg-brand', i === index);
                span.classList.toggle('bg-gray-300', i !== index);
                span.classList.toggle('w-6', i === index);
                span.classList.toggle('w-3', i !== index);
            }
            d.setAttribute('aria-pressed', i === index ? 'true' : 'false');
        });
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => goTo(+dot.dataset.slide));
    });

    // Auto-advance every 4 seconds
    setInterval(() => goTo((current + 1) % total), 4000);
}
