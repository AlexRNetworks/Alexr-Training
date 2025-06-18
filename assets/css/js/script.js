document.addEventListener('DOMContentLoaded', () => {

    // --- SMOOTH SCROLLING LOGIC ---
    // (This part remains the same)
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

    // --- PROGRESS TRACKING LOGIC ---
    // (This part remains the same)
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

    // --- NEW PROFESSIONAL IDE LOGIC ---
    // Check if we are on the project page by looking for the main editor textarea
    if (document.getElementById('code-editor')) {
        
        // Store the content for each "file" in memory
        const fileContent = {
            html: `<!DOCTYPE html>
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
</html>`,
            css: `body {
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
}`
        };

        let currentFile = 'html'; // Start with the HTML file active

        // Initialize a single CodeMirror instance
        const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            mode: 'htmlmixed',
            theme: 'vscode-dark',
            lineNumbers: true,
            value: fileContent.html
        });

        const fileButtons = document.querySelectorAll('.file');
        
        // Logic to switch the file content and editor mode
        fileButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fileType = button.dataset.file;
                if (fileType === currentFile) return; // Do nothing if clicking the active file

                // Save current content
                fileContent[currentFile] = editor.getValue();

                // De-activate all buttons
                fileButtons.forEach(btn => btn.classList.remove('active'));
                // Activate clicked button
                button.classList.add('active');

                // Load new content and set the mode
                currentFile = fileType;
                editor.setValue(fileContent[currentFile]);
                const newMode = currentFile === 'html' ? 'htmlmixed' : 'css';
                editor.setOption('mode', newMode);
            });
        });
        
        const previewFrame = document.getElementById('preview');
        const runButton = document.getElementById('run-button');

        const updatePreview = () => {
            // Before running, make sure to save the currently active editor's content
            fileContent[currentFile] = editor.getValue();

            // Construct the document from the stored content
            const previewDoc = `
                <html>
                    <head><style>${fileContent.css}</style></head>
                    <body>${fileContent.html}</body>
                </html>
            `;
            previewFrame.srcdoc = previewDoc;
        };

        runButton.addEventListener('click', updatePreview);
        updatePreview(); // Show initial boilerplate in preview
    }

    // --- INITIALIZATION ---
    loadAndApplyProgress();
});
