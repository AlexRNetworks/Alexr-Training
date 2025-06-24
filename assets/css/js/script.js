document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING & EVENT LISTENERS ---
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
        
        const fullscreenButton = document.getElementById('fullscreen-button');
        const projectIframe = document.getElementById('project-iframe');
        if (fullscreenButton && projectIframe) {
            fullscreenButton.addEventListener('click', () => {
                if (projectIframe.requestFullscreen) { projectIframe.requestFullscreen(); }
            });
        }
    };

    // --- PROGRESS TRACKING LOGIC ---
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
        if (basicCourseLessons.every(id => progress[id])) {
            const basicCard = document.querySelector('.course-card[data-course-id="basic"]');
            if (basicCard) { basicCard.classList.add('completed'); }
        }
        
        const beginnerCourseLessons = ['what-is-js', 'variables-data-types', 'functions-control-flow', 'intro-to-dom', 'project-tip-calculator'];
        if (beginnerCourseLessons.every(id => progress[id])) {
            const beginnerCard = document.querySelector('.course-card[data-course-id="beginner"]');
            if (beginnerCard) { beginnerCard.classList.add('completed'); }
        }
        
        const intermediateCourseLessons = ['async-js', 'working-with-apis', 'intro-to-react', 'react-components', 'project-user-profile-app'];
        if (intermediateCourseLessons.every(id => progress[id])) {
            const intermediateCard = document.querySelector('.course-card[data-course-id="intermediate"]');
            if (intermediateCard) { intermediateCard.classList.add('completed'); }
        }
    };

    // --- INITIALIZATION ---
    setupEventListeners();
    loadAndApplyProgress();
});
