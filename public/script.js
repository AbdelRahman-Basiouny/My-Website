// ==========================================================
// المحرك الرئيسي للتطبيق (نسخة محدثة مع API_BASE)
// ==========================================================

// رابط الباك إند على Railway
const API_BASE = 'https://my-website-production-f331.up.railway.app';

let siteContent = {};
let currentLang = localStorage.getItem('lang') || 'ar';

// 1. نبدأ كل شيء عندما يتم تحميل محتوى الصفحة
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderPage();
});

// 2. دالة لجلب البيانات من الخادم وبناء الصفحة
async function fetchAndRenderPage() {
    try {
        const response = await fetch(`${API_BASE}/api/content`);
        if (!response.ok) throw new Error('Network response was not ok');
        siteContent = await response.json();
        renderPageStructure();
    } catch (error) {
        console.error('فشل تحميل محتوى الموقع:', error);
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = '<p style="text-align: center; padding: 50px; font-size: 1.2rem;">عذراً، حدث خطأ أثناء تحميل محتوى الموقع. <br> الرجاء التأكد من أن الخادم الخلفي يعمل ثم قم بتحديث الصفحة.</p>';
        }
    }
}

// 3. دالة لبناء هيكل HTML لكل الأقسام
function renderPageStructure() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = ''; // تفريغ الصفحة أولاً
    
    if (!siteContent.sections) return;

    siteContent.sections.sort((a, b) => a.order - b.order);

    siteContent.sections.forEach(section => {
        let sectionHTML = '';
        switch (section.type) {
            case 'hero':
                sectionHTML = getNavAndHeroHTML(section.content);
                break;
            case 'about':
                sectionHTML = getAboutHTML(section.content);
                break;
            case 'skills':
                sectionHTML = getSkillsHTML(section.content, siteContent.skills);
                break;
            case 'projects':
                sectionHTML = getProjectsHTML(section.content, siteContent.projects);
                break;
            case 'contact':
                sectionHTML = getContactHTML(section.content);
                break;
        }
        pageContent.innerHTML += sectionHTML;
    });

    // 4. بعد بناء كل شيء، نقوم بتفعيل كل الوظائف التفاعلية
    initializeAllFunctions();
}

// 5. دالة رئيسية لتفعيل كل شيء بعد بناء الصفحة
function initializeAllFunctions() {
    setLanguage(currentLang);
    setupNavbarScroll();
    setupIntersectionObserver();
    setupHamburgerMenu();
    setupModal();
    runGSAPAnimations();
    setupLangSwitcher();
    setupContactForm(); // <-- تم تفعيل دالة نموذج التواصل
}

// ==========================================================
// دوال بناء قوالب HTML (كما هي من النسخة السابقة)
// ==========================================================

function getNavAndHeroHTML(content) {
    const greeting = currentLang === 'ar' ? content.greeting_key_ar : content.greeting_key_en;
    const title = currentLang === 'ar' ? content.title_key_ar : content.title_key_en;
    const subtitle = currentLang === 'ar' ? content.subtitle_key_ar : content.subtitle_key_en;

    return `
    <nav>
        <div class="container nav-container">
            <div class="logo-container">
               <a href="#" class="logo">
                    <img src="images/logo-dark.png" alt="شعار عبدالرحمن بسيوني">
                    <span data-key="logo"></span>
                </a>
            </div>
            <button class="hamburger"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
            <div class="links">
                <a href="#home" class="active" data-key="nav_home"></a>
                <a href="#about" data-key="nav_about"></a>
                <a href="#skills" data-key="nav_skills"></a>
                <a href="#projects" data-key="nav_projects"></a>
                <a href="#contact" data-key="nav_contact"></a>
                <button id="lang-switcher"></button>
            </div>
        </div>
    </nav>
    <header id="home">
        <div class="container header-container">
            <div class="header-text">
                <h1>${greeting}</h1>
                <h2>${title}</h2>
                <p>${subtitle}</p>
                <div class="header-buttons">
                    <a href="#projects" class="btn btn-primary" data-key="hero_btn_primary"></a>
                    <a href="#contact" class="btn btn-secondary" data-key="hero_btn_secondary"></a>
                </div>
            </div>
            <div class="header-image"><img src="images/profile.jpg" alt="صورة عبدالرحمن بسيوني الشخصية" class="profile-image floating"></div>
        </div>
    </header>
    `;
}

function getAboutHTML(content) {
    const title = currentLang === 'ar' ? content.title_key_ar : content.title_key_en;
    const p1 = currentLang === 'ar' ? content.p1_ar : content.p1_en;
    const p2 = currentLang === 'ar' ? content.p2_ar : content.p2_en;
    return `
    <section id="about">
        <div class="container about-container">
            <h2 class="section-title">${title}</h2>
            <div class="about-content">
                <div class="about-text"><p>${p1}</p><p>${p2}</p></div>
                <div class="about-image"><img src="images/about.jpg" alt="صورة تعبر عن تحليل البيانات" class="about-pic"></div>
            </div>
        </div>
    </section>
    `;
}

function getSkillsHTML(content, skills) {
    const title = currentLang === 'ar' ? content.title_key_ar : content.title_key_en;
    let skillsHTML = skills.map(skill => 
        `<div class="skill-card"><i class="${skill.icon}"></i><h3>${currentLang === 'ar' ? skill.name_ar : skill.name_en}</h3></div>`
    ).join('');
    return `
    <section id="skills">
        <div class="container skills-container">
            <h2 class="section-title">${title}</h2>
            <div class="skills-grid">${skillsHTML}</div>
        </div>
    </section>
    `;
}

function getProjectsHTML(content, projects) {
    const title = currentLang === 'ar' ? content.title_key_ar : content.title_key_en;
    let projectsHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-image"><img src="${project.image}" alt="صورة مشروع"></div>
            <div class="card-content">
                <h3 class="project-title">${currentLang === 'ar' ? project.title_ar : project.title_en}</h3>
                <p class="project-desc">${currentLang === 'ar' ? project.desc_ar : project.desc_en}</p>
                <a href="#" class="view-project-btn" 
                   data-title-ar="${project.title_ar}" data-title-en="${project.title_en}"
                   data-desc-ar="${project.desc_ar}" data-desc-en="${project.desc_en}"
                   data-img="${project.image}" data-live-link="${project.live_link}" data-code-link="${project.code_link}"
                   data-key="project_link"></a>
            </div>
        </div>
    `).join('');
    return `
    <section id="projects">
        <div class="container projects-container">
            <h2 class="section-title">${title}</h2>
            <div class="projects-grid">${projectsHTML}</div>
        </div>
    </section>
    <div id="project-modal" class="modal">
        <div class="modal-content">
            <span class="close-button">&times;</span><img src="" alt="صورة المشروع" id="modal-img">
            <h3 id="modal-title"></h3><p id="modal-desc"></p>
            <div class="modal-links">
                <a href="#" id="modal-live-link" class="btn btn-primary" target="_blank" rel="noopener noreferrer" data-key="modal_live_demo"></a>
                <a href="#" id="modal-code-link" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" data-key="modal_view_code"></a>
            </div>
        </div>
    </div>
    `;
}

function getContactHTML(content) {
    const title = currentLang === 'ar' ? content.title_key_ar : content.title_key_en;
    return `
    <section id="contact">
        <div class="container contact-container">
            <h2 class="section-title">${title}</h2><p class="contact-subtitle" data-key="contact_subtitle"></p>
            <div class="contact-content-wrapper">
                <div class="contact-form-card glow-effect">
                    <form id="contact-form" class="contact-form">
                        <input type="text" name="name" data-key-placeholder="form_name" required>
                        <input type="email" name="email" data-key-placeholder="form_email" required>
                        <textarea name="message" rows="7" data-key-placeholder="form_message" required></textarea>
                        <button type="submit" class="btn btn-primary" data-key="form_submit"></button>
                    </form>
                </div>
                <div class="contact-info-card glow-effect">
                    <h3 data-key="contact_info_title"></h3><p data-key="contact_info_desc"></p>
                    <ul class="contact-details">
                        <li><i class="fa-solid fa-map-marker-alt"></i><div><h4 data-key="contact_info_location"></h4><p>Damanhour City, Beheira</p></div></li>
                        <li><i class="fa-solid fa-envelope"></i><div><h4 data-key="contact_info_email"></h4><p>abdelrahman3dell@gmail.com</p></div></li>
                        <li><i class="fa-solid fa-phone"></i><div><h4 data-key="contact_info_phone"></h4><p>+201003467361</p></div></li>
                    </ul>
                    <div class="social-links">
                         <a href="https://www.linkedin.com/in/abdelrahman-adel-basiouny-095b392b3/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
                         <a href="https://github.com/AbdelRahman-Basiouny" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
                         <a href="https://www.facebook.com/share/1749bku3R8/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                         <a href="https://x.com/3bdoadell?t=vNIvdLdOKoCM5vcWT5I_fw&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i class="fa-brands fa-twitter"></i></a>
                         <a href="https://www.instagram.com/abdelrahman_3dell?igsh=NG0yY3k1bmRxdjF3" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <footer><div class="container"><p data-key="footer_text"></p></div></footer>
    `;
}

// ==========================================================
// دوال الوظائف التفاعلية
// ==========================================================
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    document.querySelectorAll('[data-key-placeholder]').forEach(element => {
        const key = element.getAttribute('data-key-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.textContent = lang === 'ar' ? 'EN' : 'ع';
    }
}

function setupLangSwitcher() {
    const langSwitcherBtn = document.getElementById('lang-switcher');
    if (langSwitcherBtn) {
        langSwitcherBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            currentLang = newLang;
            renderPageStructure();
        });
    }
}

function setupNavbarScroll() {
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }
}

function setupIntersectionObserver() {
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.links a');
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').substring(1) === entry.target.id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { threshold: 0.5 });
    sections.forEach(section => observer.observe(section));
}

function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinksContainer = document.querySelector('.links');
    if (hamburger && navLinksContainer) {
        hamburger.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
        });
    }
}

function setupModal() {
    const projectModal = document.getElementById('project-modal');
    if (!projectModal) return;
    const closeModalBtn = projectModal.querySelector('.close-button');

    document.getElementById('page-content').addEventListener('click', (e) => {
        if (e.target.closest('.view-project-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.view-project-btn');
            projectModal.querySelector('#modal-img').src = btn.dataset.img;
            projectModal.querySelector('#modal-title').textContent = currentLang === 'ar' ? btn.dataset.titleAr : btn.dataset.titleEn;
            projectModal.querySelector('#modal-desc').textContent = currentLang === 'ar' ? btn.dataset.descAr : btn.dataset.descEn;
            projectModal.querySelector('#modal-live-link').href = btn.dataset.liveLink;
            projectModal.querySelector('#modal-code-link').href = btn.dataset.codeLink;
            projectModal.style.display = 'flex';
        }
    });

    const closeModal = () => projectModal.style.display = 'none';
    closeModalBtn.addEventListener('click', closeModal);
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) closeModal();
    });
}

function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'جار الإرسال...';
        submitButton.disabled = true;

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE}/api/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resultText = await response.text();
            if (response.ok) {
                alert(resultText);
                contactForm.reset();
            } else {
                throw new Error(resultText);
            }
        } catch (error) {
            console.error('Contact form error:', error);
            alert('عذراً، حدث خطأ ما. الرجاء المحاولة مرة أخرى.');
        } finally {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

function runGSAPAnimations() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    setTimeout(() => {
        document.querySelectorAll('section, header').forEach(section => {
            gsap.from(section, {
                opacity: 0,
                y: 50,
                duration: 1,
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                }
            });
        });
    }, 100);
}
