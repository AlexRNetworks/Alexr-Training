document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING LOGIC ---
    // Handles smooth scroll for nav links pointing to the homepage (e.g., /#courses)
    document.querySelectorAll('a[href^="/#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const homeUrl = new URL(anchor.baseURI).origin;
            const targetHash = this.getAttribute('href');
            // Navigate to homepage and let the browser handle scrolling to the hash
            window.location.href = homeUrl + targetHash;
        });
    });

    // Handles smooth scrolling for on-page links (e.g., #courses)
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
    const completeLesson = (lessonId) => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        progress[lessonId] = true;
        localStorage.setItem('alexrTrainingProgress', JSON.stringify(progress));
    };

    const loadAndApplyProgress = () => {
        let progress = JSON.parse(localStorage.getItem('alexrTrainingProgress')) || {};
        
        document.querySelectorAll('.lesson-item[data-lesson-id]').forEach(item => {
            const lessonId = item.dataset.lessonId;
            if (progress[lessonId]) {
                item.classList.add('completed');
            }
        });

        const basicCourseLessons = ['html-basics', 'structuring-a-page', 'intro-to-css', 'box-model', 'project-portfolio'];
        const isBasicCourseComplete = basicCourseLessons.every(id => progress[id]);

        if (isBasicCourseComplete) {
            const basicCourseCard = document.querySelector('.course-card[data-course-id="basic"]');
            if (basicCourseCard) {
                basicCourseCard.classList.add('completed');
            }
        }
    };

    const lessonNavButtons = document.querySelectorAll('.nav-button[data-lesson-id]');
    lessonNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lessonId = button.dataset.lessonId;
            if (lessonId) {
                completeLesson(lessonId);
            }
        });
    });

    // --- INTERACTIVE IDE LOGIC ---
    // Check if we are on the project page by looking for the editor elements
    if (document.getElementById('html-editor') && document.getElementById('css-editor')) {
        
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

    <h2>My Skills</h2>
    <ul>
        <li>HTML</li>
        <li>CSS</li>
    </ul>
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
    color: #0056b3; /* Blue from our site */
}

h2 {
    border-bottom: 2px solid #0056b3;
    padding-bottom: 5px;
    margin-top: 30px;
}`;

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

        const updatePreview = () => {
            const htmlCode = htmlEditor.getValue();
            const cssCode = cssEditor.getValue();
            const previewDoc = `
                <html>
                    <head>
                        <style>${cssCode}</style>
                    </head>
                    <body>${htmlCode}</body>
                </html>
            `;
            previewFrame.srcdoc = previewDoc;
        };

        htmlEditor.on('change', updatePreview);
        cssEditor.on('change', updatePreview);

        updatePreview(); // Initial update
    }


    // --- INITIALIZATION ---
    loadAndApplyProgress();
});
