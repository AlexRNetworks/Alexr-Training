// Wait for the entire HTML document to be loaded and parsed before running the script
document.addEventListener('DOMContentLoaded', () => {

    //======================================================================
    // 1. SMOOTH SCROLLING FOR ANCHOR LINKS
    // (Kept from previous version - still highly relevant)
    //======================================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    //======================================================================
    // 2. ACTIVE NAVIGATION LINK ON SCROLL
    // (Kept from previous version - works with new section IDs)
    //======================================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav ul a');

    const onScroll = () => {
        const scrollPosition = window.scrollY + 150; // Offset for earlier activation

        sections.forEach(section => {
            if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').substring(1) === section.getAttribute('id')) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', onScroll);


    //======================================================================
    // 3. NEW: REVEAL ELEMENTS ON SCROLL
    // (Adds a reactive fade-in animation to elements)
    //======================================================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Select all elements you want to have the reveal animation
    const elementsToReveal = document.querySelectorAll('.feature, .course-card, .experience-item');
    elementsToReveal.forEach((el) => observer.observe(el));

});
