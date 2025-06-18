document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING & PROGRESS TRACKING LOGIC ---
    // (This part is unchanged and correct)
    const setupEventListeners = () => {
        document.querySelectorAll('a[href^="/#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const homeUrl = new URL(anchor.baseURI).origin;
                window.location.href = homeUrl + this.getAttribute('href');
            });
        });
         document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth' }); }
            });
        });

        const lessonNavButtons = document.querySelectorAll('.nav-button[data-lesson-id]');
        lessonNavButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lessonId = button.dataset.lessonId;
                if (lessonId) { completeLesson(lessonId); }
            });
        });
    };

    const completeLesson = (lessonId) => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        progress[lessonId] = true;
        localStorage.setItem('alexrTrainingProgress', JSON.stringify(progress));
    };

    const loadAndApplyProgress = () => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        document.querySelectorAll('.lesson-item[data-lesson-id]').forEach(item => {
            const lessonId = item.dataset.lessonId;
            if (progress[lessonId]) { item.classList.add('completed'); }
        });
        const basicCourseLessons = ['html-basics', 'structuring-a-page', 'intro-to-css', 'box-model', 'project-portfolio'];
        const isBasicCourseComplete = basicCourseLessons.every(id => progress[id]);
        if (isBasicCourseComplete) {
            const basicCourseCard = document.querySelector('.course-card[data-course-id="basic"]');
            if (basicCourseCard) { basicCourseCard.classList.add('completed'); }
        }
    };

    // --- NEW IFRAME FULLSCREEN LOGIC ---
    const fullscreenButton = document.getElementById('fullscreen-button');
    const projectIframe = document.getElementById('project-iframe');

    if (fullscreenButton && projectIframe) {
        fullscreenButton.addEventListener('click', () => {
            // Request fullscreen on the iframe element
            if (projectIframe.requestFullscreen) {
                projectIframe.requestFullscreen();
            } else if (projectIframe.webkitRequestFullscreen) { /* Safari */
                projectIframe.webkitRequestFullscreen();
            } else if (projectIframe.msRequestFullscreen) { /* IE11 */
                projectIframe.msRequestFullscreen();
            }
        });
    }

    // --- INITIALIZATION ---
    setupEventListeners();
    loadAndApplyProgress();
});
