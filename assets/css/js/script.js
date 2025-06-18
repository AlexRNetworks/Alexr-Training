document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING LOGIC ---
    // This handles the smooth scroll when clicking nav links like /#courses from another page
    document.querySelectorAll('a[href^="/#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            // We need to build the full URL of the homepage to jump to the section
            const homeUrl = new URL(anchor.baseURI).origin;
            window.location.href = homeUrl + this.getAttribute('href');
        });
    });

    // This handles smooth scrolling for on-page links (when you are already on the homepage)
     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });


    // --- PROGRESS TRACKING LOGIC ---

    /**
     * Saves a lesson's ID to the browser's localStorage.
     * @param {string} lessonId - The unique ID of the lesson to be marked as complete.
     */
    const completeLesson = (lessonId) => {
        console.log(`Completing lesson: ${lessonId}`);
        // Get existing progress from localStorage, or create a new empty object
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        // Mark the lesson as true (completed)
        progress[lessonId] = true;
        // Save the updated progress object back to localStorage
        localStorage.setItem('alexrTrainingProgress', JSON.stringify(progress));
    };

    /**
     * Checks localStorage for completed lessons and applies a 'completed' class
     * to the corresponding elements on the page.
     */
    const loadAndApplyProgress = () => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        
        // Find all lesson items on the /courses/basic/basic-course.html page
        document.querySelectorAll('.lesson-item[data-lesson-id]').forEach(item => {
            const lessonId = item.dataset.lessonId;
            if (progress[lessonId]) {
                item.classList.add('completed');
            }
        });

        // Define which lessons make up the "Basic" course
        const basicCourseLessons = ['html-basics', 'structuring-a-page', 'intro-to-css', 'box-model', 'project-portfolio'];
        // Check if EVERY lesson in the array exists and is true in our progress object
        const isBasicCourseComplete = basicCourseLessons.every(id => progress[id]);

        // If the entire course is complete, add the 'completed' class to the course card on the homepage
        if (isBasicCourseComplete) {
            const basicCourseCard = document.querySelector('.course-card[data-course-id="basic"]');
            if (basicCourseCard) {
                basicCourseCard.classList.add('completed');
            }
        }
    };

    /**
     * Attaches a click event listener to all lesson navigation buttons.
     * When clicked, it calls the function to save the lesson's progress.
     */
    const lessonNavButtons = document.querySelectorAll('.nav-button[data-lesson-id]');
    lessonNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lessonId = button.dataset.lessonId;
            if (lessonId) {
                completeLesson(lessonId);
            }
        });
    });


    // --- REVEAL ON SCROLL LOGIC ---
    // Note: The CSS for this animation was temporarily removed to fix the invisible
    // content bug, but the JavaScript is harmless and ready for when we re-enable it.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // When the element is in view, add the 'visible' class
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Select all elements you want to have the reveal animation in the future
    const elementsToReveal = document.querySelectorAll('.feature, .course-card, .experience-item');
    elementsToReveal.forEach((el) => observer.observe(el));


    // --- INITIALIZATION ---
    // Load progress as soon as the DOM is ready to apply any existing checkmarks.
    loadAndApplyProgress();
// --- NEW INTERACTIVE IDE LOGIC ---
    // Check if we are on the project page by looking for the editor elements
    if (document.getElementById('html-editor') && document.getElementById('css-editor')) {
        
        // Starting boilerplate code for the user
        const startingHtml = `<h1>Your Name</h1>
<p>Aspiring Web Developer</p>
`;
        const startingCss = `/* Your portfolio CSS goes here! */
body {
    font-family: sans-serif;
    padding: 20px;
}`;

        // Configure and initialize the HTML editor
        const htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
            mode: 'htmlmixed',
            theme: 'material-darker',
            lineNumbers: true,
            value: startingHtml
        });

        // Configure and initialize the CSS editor
        const cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css',
            theme: 'material-darker',
            lineNumbers: true,
            value: startingCss
        });

        const previewFrame = document.getElementById('preview');

        // Function to update the preview pane
        const updatePreview = () => {
            const htmlCode = htmlEditor.getValue();
            const cssCode = cssEditor.getValue();

            // Construct the full HTML document for the iframe
            const previewDoc = `
                <html>
                    <head>
                        <style>${cssCode}</style>
                    </head>
                    <body>${htmlCode}</body>
                </html>
            `;
            // The srcdoc attribute is a great way to inject content into an iframe
            previewFrame.srcdoc = previewDoc;
        };

        // Add event listeners to update the preview whenever the user types
        htmlEditor.on('change', updatePreview);
        cssEditor.on('change', updatePreview);

        // Initial update to show the starting code
        updatePreview();
    }

});
