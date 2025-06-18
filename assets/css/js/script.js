document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING LOGIC ---
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
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

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
        const isBasicCourseComplete = basicCourseLessons.every(id => progress[id]);
        if (isBasicCourseComplete) {
            const basicCourseCard = document.querySelector('.course-card[data-course-id="basic"]');
            if (basicCourseCard) { basicCourseCard.classList.add('completed'); }
        }
    };

    const lessonNavButtons = document.querySelectorAll('.nav-button[data-lesson-id]');
    lessonNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lessonId = button.dataset.lessonId;
            if (lessonId) { completeLesson(lessonId); }
        });
    });

    // --- REVERTED AND SIMPLIFIED INTERACTIVE IDE LOGIC ---
    if (document.getElementById('html-editor')) {
        
        const startingHtml = `\n<h1>Your Name</h1>\n`;
        const startingCss = `/* Type your CSS code here! */\nbody {\n    font-family: sans-serif;\n}\n\nh1 {\n    color: steelblue;\n}`;

        const htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
            mode: 'htmlmixed',
            theme: 'material-darker',
            lineNumbers: true,
            value: startingHtml
        });

        const cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css',
            theme: 'material-darker',
            lineNumbers: true,
            value: startingCss
        });

        const previewFrame = document.getElementById('preview');
        const runButton = document.getElementById('run-button');

        const updatePreview = () => {
            const htmlCode = htmlEditor.getValue();
            const cssCode = cssEditor.getValue();
            const previewDoc = `
                <html><head><style>${cssCode}</style></head><body>${htmlCode}</body></html>
            `;
            previewFrame.srcdoc = previewDoc;
        };

        // Update the preview only when the button is clicked
        runButton.addEventListener('click', updatePreview);

        // Optional: Run once on load to show the initial boilerplate
        updatePreview();
    }

    // --- INITIALIZATION ---
    loadAndApplyProgress();
});
