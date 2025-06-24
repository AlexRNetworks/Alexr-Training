document.addEventListener('DOMContentLoaded', () => {

    // --- EVENT LISTENER SETUP ---
    const setupEventListeners = () => {
        // Smooth scrolling for on-page anchors
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth' }); }
            });
        });

        // Lesson completion buttons
        const lessonNavButtons = document.querySelectorAll('.nav-button[data-lesson-id]');
        lessonNavButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lessonId = button.dataset.lessonId;
                if (lessonId) { completeLesson(lessonId); }
            });
        });
    };

    // --- PROGRESS TRACKING LOGIC ---
    const completeLesson = (lessonId) => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        progress[lessonId] = true;
        localStorage.setItem('alexrTrainingProgress', JSON.stringify(progress));
        console.log(`Lesson '${lessonId}' marked as complete. Current progress:`, progress);
    };

    const loadAndApplyProgress = () => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        
        // --- This is our new, more robust checking logic ---
        console.log("Checking progress...", progress);

        // Apply checkmarks to individual lessons on course pages
        document.querySelectorAll('.lesson-item[data-lesson-id]').forEach(item => {
            const lessonId = item.dataset.lessonId;
            if (progress[lessonId]) {
                item.classList.add('completed');
            }
        });

        // Define all courses and their lessons in one place for easy management
        const courses = {
            basic: ['html-basics', 'structuring-a-page', 'intro-to-css', 'box-model', 'project-portfolio'],
            beginner: ['what-is-js', 'variables-data-types', 'functions-control-flow', 'intro-to-dom', 'project-tip-calculator'],
            intermediate: ['async-js', 'working-with-apis', 'intro-to-react', 'react-components', 'project-user-profile-app']
        };

        // Loop through each course to check for completion
        for (const courseId in courses) {
            const lessonIds = courses[courseId];
            const courseCard = document.querySelector(`.course-card[data-course-id="${courseId}"]`);
            
            if (courseCard) {
                // The 'every' method checks if ALL lessons in the array are present in our progress object
                const isComplete = lessonIds.every(id => progress[id]);
                
                // Log the status for debugging
                console.log(`Course '${courseId}' is complete: ${isComplete}`);

                if (isComplete) {
                    courseCard.classList.add('completed');
                }
            }
        }
    };

    // --- INITIALIZATION ---
    setupEventListeners();
    loadAndApplyProgress();
});
