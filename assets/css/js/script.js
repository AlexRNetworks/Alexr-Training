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

    // --- NEW STABLE IDE LOGIC ---
    // Check if we are on the project page
    if (document.getElementById('html-editor')) {
        
        const startingHtml = `<!DOCTYPE html>
<html>
<head>
    <title>My Portfolio</title>
</head>
<body>
    <h1>Your Name</h1>
    <p>Aspiring Web Developer</p>

    <h2>About Me</h2>
    <p>I am learning to code with Alexr Training!</p>
</body>
</html>`;

        const startingCss = `body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    background-color: #f0f4f8;
    color: #333;
    padding: 20px;
}

h1 {
    color: #0056b3;
}`;

        // Initialize two separate editors
        const htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
            mode: 'htmlmixed', theme: 'vscode-dark', lineNumbers: true, value: startingHtml
        });
        const cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css', theme: 'vscode-dark', lineNumbers: true, value: startingCss
        });

        // Hide the CSS editor by default
        const cssEditorWrapper = cssEditor.getWrapperElement();
        cssEditorWrapper.style.display = 'none';

        // File switching logic
        const fileButtons = document.querySelectorAll('.file');
        fileButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fileType = button.dataset.editor;

                fileButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                if (fileType === 'html') {
                    cssEditorWrapper.style.display = 'none';
                    htmlEditor.getWrapperElement().style.display = 'block';
                    htmlEditor.refresh();
                } else {
                    htmlEditor.getWrapperElement().style.display = 'none';
                    cssEditorWrapper.style.display = 'block';
                    cssEditor.refresh(); // Crucial step to fix display bugs on hidden editors
                }
            });
        });
        
        // Preview logic
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

        runButton.addEventListener('click', updatePreview);
        updatePreview(); // Initial preview
    }

    // --- INITIALIZATION ---
    setupEventListeners();
    loadAndApplyProgress();
});
