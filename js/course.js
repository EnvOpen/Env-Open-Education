// Course-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Course progress tracking - only count actual lesson content, not footer/resources
    let courseProgress = {
        completedLessons: [],
        totalLessons: 0, // Will be calculated dynamically based on actual lesson content
        currentLesson: 1
    };

    // Calculate total lessons dynamically, excluding footer and additional resources
    function calculateTotalLessons() {
        const lessonElements = document.querySelectorAll('.lesson-content[id^="lesson-"]');
        const lessonItems = document.querySelectorAll('.lesson-item a[href^="#lesson-"]');
        
        // Use the higher count between actual lesson content divs and navigation items
        const contentCount = lessonElements.length;
        const navCount = lessonItems.length;
        
        courseProgress.totalLessons = Math.max(contentCount, navCount);
        
        // If no lesson content found, default to sidebar navigation count
        if (courseProgress.totalLessons === 0) {
            courseProgress.totalLessons = 25; // Fallback for existing courses
        }
    }

    // Calculate total lessons on page load
    calculateTotalLessons();

    // Load progress from localStorage
    const savedProgress = localStorage.getItem('courseProgress');
    if (savedProgress) {
        const saved = JSON.parse(savedProgress);
        courseProgress.completedLessons = saved.completedLessons || [];
        courseProgress.currentLesson = saved.currentLesson || 1;
        // Always recalculate totalLessons to ensure accuracy
        calculateTotalLessons();
    }

    // Update progress display
    function updateProgress() {
        const progressText = document.querySelector('.progress-text');
        const progressFill = document.querySelector('.progress-fill');
        const progressInfo = document.querySelector('.progress-info span:last-child');

        if (progressText && progressFill) {
            const percentage = Math.round((courseProgress.completedLessons.length / courseProgress.totalLessons) * 100);
            progressText.textContent = percentage + '%';
            progressFill.style.width = percentage + '%';
            
            // Update progress circle
            const progressCircle = document.querySelector('.progress-circle');
            if (progressCircle) {
                const angle = (percentage / 100) * 360;
                progressCircle.style.background = `conic-gradient(#2563eb ${angle}deg, #e2e8f0 ${angle}deg)`;
            }
        }

        if (progressInfo) {
            progressInfo.textContent = `${courseProgress.completedLessons.length} of ${courseProgress.totalLessons} lessons completed`;
        }

        // Save to localStorage
        localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
    }

    // Mark lesson as complete - only for actual lesson content
    function completeLesson(lessonId) {
        // Ensure we're only marking actual lesson content as complete
        const lessonElement = document.getElementById(`lesson-${lessonId}`);
        if (lessonElement && lessonElement.classList.contains('lesson-content')) {
            if (!courseProgress.completedLessons.includes(lessonId)) {
                courseProgress.completedLessons.push(lessonId);
                updateProgress();
                showCompletionMessage();
            }
        }
    }

    // Track lesson completion based on scroll position (only for lesson content)
    function trackLessonProgress() {
        const lessonContent = document.querySelector('.lesson-content');
        if (!lessonContent) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
                    // Only track if the element is actual lesson content, not footer/resources
                    const lessonElement = entry.target;
                    if (lessonElement.classList.contains('lesson-content') && lessonElement.id.startsWith('lesson-')) {
                        const lessonNumber = parseInt(lessonElement.id.replace('lesson-', ''));
                        if (!isNaN(lessonNumber)) {
                            completeLesson(lessonNumber);
                        }
                    }
                }
            });
        }, { threshold: 0.8 });

        // Only observe lesson content elements, exclude footer and resources
        const lessonElements = document.querySelectorAll('.lesson-content[id^="lesson-"]');
        lessonElements.forEach(element => {
            observer.observe(element);
        });
    }

    // Show completion message
    function showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.innerHTML = '✅ Lesson completed! Great job!';
        message.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Add CSS animation for completion message
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Module expansion/collapse
    const moduleItems = document.querySelectorAll('.module-item h4');
    moduleItems.forEach(moduleHeader => {
        moduleHeader.addEventListener('click', function() {
            const module = this.parentElement;
            const lessonList = module.querySelector('.lesson-list');
            
            if (lessonList) {
                const isExpanded = lessonList.style.maxHeight && lessonList.style.maxHeight !== '0px';
                
                if (isExpanded) {
                    lessonList.style.maxHeight = '0px';
                    lessonList.style.opacity = '0';
                    module.classList.remove('expanded');
                } else {
                    lessonList.style.maxHeight = lessonList.scrollHeight + 'px';
                    lessonList.style.opacity = '1';
                    module.classList.add('expanded');
                }
            }
        });
    });

    // Initialize lesson lists with smooth transitions
    const lessonLists = document.querySelectorAll('.lesson-list');
    lessonLists.forEach(list => {
        list.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
        list.style.overflow = 'hidden';
        
        // Expand active module by default
        const module = list.closest('.module-item');
        if (module && module.classList.contains('active')) {
            list.style.maxHeight = list.scrollHeight + 'px';
            list.style.opacity = '1';
        } else {
            list.style.maxHeight = '0px';
            list.style.opacity = '0';
        }
    });

    // Lesson navigation
    window.nextLesson = function() {
        const currentLessonId = courseProgress.currentLesson;
        completeLesson(currentLessonId);
        
        const nextLessonId = currentLessonId + 1;
        const nextLessonElement = document.getElementById(`lesson-${nextLessonId}`);
        
        if (nextLessonElement) {
                        // Hide current lesson
            if (currentLessonElement) {
                currentLessonElement.classList.add('hidden');
            }
            
            // Show next lesson
            nextLessonElement.classList.remove('hidden');
            
            // Update navigation state
            updateLessonNavigation(currentLessonId, nextLessonId);
            
            // Update course progress
            courseProgress.currentLesson = nextLessonId;
            localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
            
            // Scroll to top of lesson content
            nextLessonElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.previousLesson = function() {
        const currentLessonId = courseProgress.currentLesson;
        const prevLessonId = currentLessonId - 1;
        const prevLessonElement = document.getElementById(`lesson-${prevLessonId}`);
        
        if (prevLessonElement && prevLessonId >= 1) {
            // Hide current lesson
            const currentLessonElement = document.getElementById(`lesson-${currentLessonId}`);
            if (currentLessonElement) {
                currentLessonElement.classList.add('hidden');
            }
            
            // Show previous lesson
            prevLessonElement.classList.remove('hidden');
            
            // Update navigation state
            updateLessonNavigation(currentLessonId, prevLessonId);
            
            // Update course progress
            courseProgress.currentLesson = prevLessonId;
            localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
            
            // Scroll to top of lesson content
            prevLessonElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Update lesson navigation UI
    function updateLessonNavigation(oldLessonId, newLessonId) {
        // Update sidebar navigation
        const oldNavItem = document.querySelector(`a[href="#lesson-${oldLessonId}"]`);
        const newNavItem = document.querySelector(`a[href="#lesson-${newLessonId}"]`);
        
        if (oldNavItem) {
            oldNavItem.closest('.lesson-item').classList.remove('active');
        }
        if (newNavItem) {
            newNavItem.closest('.lesson-item').classList.add('active');
        }
        
        // Update lesson navigation buttons
        const prevButtons = document.querySelectorAll('.lesson-navigation-buttons .btn-secondary');
        const nextButtons = document.querySelectorAll('.lesson-navigation-buttons .btn-primary');
        
        // Update previous button states
        prevButtons.forEach(btn => {
            if (newLessonId <= 1) {
                btn.disabled = true;
                btn.textContent = '← Previous Lesson';
            } else {
                btn.disabled = false;
                btn.textContent = '← Previous Lesson';
            }
        });
        
        // Update next button states
        nextButtons.forEach(btn => {
            const nextLessonExists = document.getElementById(`lesson-${newLessonId + 1}`);
            if (!nextLessonExists) {
                btn.disabled = true;
                btn.textContent = 'Course Complete! ✅';
            } else {
                btn.disabled = false;
                btn.textContent = 'Next Lesson →';
            }
        });
    }

    // Simulate code execution feedback
    const trinketIframes = document.querySelectorAll('iframe[src*="trinket.io"]');
    trinketIframes.forEach(iframe => {
        // Add run button overlay for practice sections
        const practiceSection = iframe.closest('.practice-section, .project-playground');
        if (practiceSection) {
            const runBtn = document.createElement('button');
            runBtn.textContent = '▶ Run Code';
            runBtn.className = 'run-code-btn';
            runBtn.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                z-index: 10;
            `;

            iframe.parentElement.style.position = 'relative';
            iframe.parentElement.appendChild(runBtn);

            runBtn.addEventListener('click', function() {
                // Simulate code execution feedback
                const feedback = document.createElement('div');
                feedback.className = 'code-feedback';
                feedback.innerHTML = '✅ Code executed successfully!';
                feedback.style.cssText = `
                    position: absolute;
                    bottom: 50px;
                    right: 10px;
                    background: #10b981;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    animation: fadeInOut 2s ease;
                `;

                iframe.parentElement.appendChild(feedback);
                setTimeout(() => feedback.remove(), 2000);
            });
        }
    });

    // Add fade animation for feedback
    const feedbackStyle = document.createElement('style');
    feedbackStyle.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(10px); }
            50% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(feedbackStyle);

    // Lesson completion tracking based on scroll (only lesson content, not footer/resources)
    let hasScrolledToLessonEnd = false;
    window.addEventListener('scroll', function() {
        const lessonContent = document.querySelector('.lesson-content');
        if (!lessonContent) return;
        
        const scrollPosition = window.scrollY + window.innerHeight;
        const lessonBottom = lessonContent.offsetTop + lessonContent.offsetHeight;
        
        // Check if user has scrolled to the end of the lesson content (not footer/resources)
        if (scrollPosition >= lessonBottom - 50 && !hasScrolledToLessonEnd) {
            hasScrolledToLessonEnd = true;
            // Auto-complete lesson if user has scrolled to end of lesson content
            setTimeout(() => {
                if (confirm('You\'ve completed this lesson content. Mark it as complete?')) {
                    completeLesson(courseProgress.currentLesson);
                }
            }, 1000);
        }
    });

    // Initialize progress display
    updateProgress();

    // Initialize lesson progress tracking (only for actual lesson content)
    trackLessonProgress();

    // Initialize lesson display - show current lesson, hide others
    function initializeLessonDisplay() {
        const allLessons = document.querySelectorAll('.lesson-content[id^="lesson-"]');
        const currentLessonId = courseProgress.currentLesson;
        
        allLessons.forEach(lesson => {
            const lessonId = parseInt(lesson.id.replace('lesson-', ''));
            if (lessonId === currentLessonId) {
                lesson.classList.remove('hidden');
            } else {
                lesson.classList.add('hidden');
            }
        });
        
        // Update navigation UI for current lesson
        updateLessonNavigation(0, currentLessonId);
    }

    // Initialize lesson display
    initializeLessonDisplay();

    // Add click handlers for sidebar lesson navigation
    const lessonLinks = document.querySelectorAll('.lesson-item a[href^="#lesson-"]');
    lessonLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const lessonId = parseInt(this.getAttribute('href').replace('#lesson-', ''));
            if (lessonId && document.getElementById(`lesson-${lessonId}`)) {
                navigateToLesson(lessonId);
            }
        });
    });

    // Navigate to specific lesson
    function navigateToLesson(targetLessonId) {
        const currentLessonId = courseProgress.currentLesson;
        const targetLessonElement = document.getElementById(`lesson-${targetLessonId}`);
        
        if (targetLessonElement) {
            // Hide current lesson
            const currentLessonElement = document.getElementById(`lesson-${currentLessonId}`);
            if (currentLessonElement) {
                currentLessonElement.classList.add('hidden');
            }
            
            // Show target lesson
            targetLessonElement.classList.remove('hidden');
            
            // Update navigation state
            updateLessonNavigation(currentLessonId, targetLessonId);
            
            // Update course progress
            courseProgress.currentLesson = targetLessonId;
            localStorage.setItem('courseProgress', JSON.stringify(courseProgress));
            
            // Scroll to top of lesson content
            targetLessonElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Add keyboard shortcuts for navigation
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Right Arrow = Next lesson
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
            e.preventDefault();
            const nextBtn = document.querySelector('.lesson-navigation-buttons .btn-primary');
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.click();
            }
        }

        // Ctrl/Cmd + Left Arrow = Previous lesson
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevBtn = document.querySelector('.lesson-navigation-buttons .btn-secondary');
            if (prevBtn && !prevBtn.disabled) {
                prevBtn.click();
            }
        }

        // 'C' key = Complete lesson
        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                completeLesson(courseProgress.currentLesson);
            }
        }
    });

    // Add progress indicator for reading (only lesson content, not footer/resources)
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 70px;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #2563eb, #10b981);
        z-index: 999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        // Calculate progress based only on current visible lesson content
        const currentLessonElement = document.getElementById(`lesson-${courseProgress.currentLesson}`);
        
        if (currentLessonElement && !currentLessonElement.classList.contains('hidden')) {
            const scrollTop = window.scrollY;
            const lessonTop = currentLessonElement.offsetTop;
            const lessonHeight = currentLessonElement.offsetHeight;
            const lessonBottom = lessonTop + lessonHeight;
            const windowHeight = window.innerHeight;
            
            // Calculate progress only for the current lesson
            if (scrollTop + windowHeight > lessonTop) {
                const maxScroll = Math.max(0, lessonBottom - windowHeight);
                const lessonScrollTop = Math.max(0, scrollTop - lessonTop);
                const scrollPercent = maxScroll > 0 ? (lessonScrollTop / (lessonHeight - windowHeight)) * 100 : 100;
                
                progressBar.style.width = Math.min(Math.max(scrollPercent, 0), 100) + '%';
            }
        }
    });
});
