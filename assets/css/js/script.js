document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING LOGIC ---
    // This handles the smooth scroll when clicking nav links like /#courses
    document.querySelectorAll('a[href^="/#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(2); // remove /#
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // This handles smooth scrolling for on-page links that don't have the root slash
     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    // --- NEW PROGRESS TRACKING LOGIC ---

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

    // --- INITIALIZATION ---
    // Load progress as soon as the DOM is ready to apply any existing checkmarks.
    loadAndApplyProgress();

});
