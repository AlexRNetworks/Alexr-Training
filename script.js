// Wait for the entire HTML document to be loaded and parsed before running the script
document.addEventListener('DOMContentLoaded', () => {

    //======================================================================
    // 1. SMOOTH SCROLLING FOR ANCHOR LINKS
    //======================================================================
    // Select all anchor links that have a href starting with '#'
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent the default jump behavior
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth', // This is the magic part!
                    block: 'start'
                });
            }
        });
    });


    //======================================================================
    // 2. WAITLIST FORM VALIDATION
    //======================================================================
    const waitlistForm = document.querySelector('#waitlist form');
    const emailInput = document.querySelector('#waitlist input[type="email"]');

    waitlistForm.addEventListener('submit', function(e) {
        // Prevent the form from submitting by default
        e.preventDefault();

        const email = emailInput.value;

        // A simple regex for email validation
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (email.trim() === '') {
            alert('Please enter your email address.');
        } else if (!isValidEmail) {
            alert('Please enter a valid email address.');
        } else {
            // If the email is valid, you can proceed.
            // In a real application, you would send this to a server or email service.
            alert('Thank you for joining the waitlist!');
            this.submit(); // Or use fetch() to send the data without a page reload
        }
    });


    //======================================================================
    // 3. BONUS: ACTIVE NAVIGATION LINK ON SCROLL
    //======================================================================
    // Note: This requires sections to have an 'id' that matches the nav link's href
    // We will add IDs to the sections in index.html for this to work.
    // For now, this code is ready for when you add those IDs.
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('header nav ul a');

    const onScroll = () => {
        const scrollPosition = window.scrollY + 150; // Offset to trigger a bit earlier

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

});
