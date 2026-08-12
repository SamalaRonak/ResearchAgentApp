/**
 * Main Application Controller for Aetheria Research Agent
 * Sets up event listeners, tab navigation, PDF dropzones, settings,
 * and handles data binding between the Agent Engine and the UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements Reference
    const btnStart = document.getElementById('btn-start');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnClearConsole = document.getElementById('btn-clear-console');
    const btnExport = document.getElementById('btn-export');
    
    const inputQuery = document.getElementById('research-query');
    const sourceArxiv = document.getElementById('source-arxiv');
    const sourceWeb = document.getElementById('source-web');
    
    // PDF Upload Dropzone
    const pdfDropzone = document.getElementById('pdf-dropzone');
    const pdfInput = document.getElementById('pdf-input');
    const pdfTrigger = document.getElementById('pdf-trigger');
    const pdfBadge = document.getElementById('pdf-badge');
    
    // Settings modal fields
    const modalSettings = document.getElementById('settings-modal');
    const inputGeminiKey = document.getElementById('gemini-key');
    const selectSearchLimit = document.getElementById('search-limit');
    
    // Output Placeholders & Containers
    const discoveryPlaceholder = document.getElementById('discovery-placeholder');
    const discoveryResults = document.getElementById('discovery-results');
    const discoveryCount = document.getElementById('discovery-count');
    
    const retrievalPlaceholder = document.getElementById('retrieval-placeholder');
    const retrievalResults = document.getElementById('retrieval-results');
    const retrievalSummaryText = document.getElementById('retrieval-summary-text');
    const comparisonTableBody = document.querySelector('#comparison-table tbody');
    const evidenceBlocks = document.getElementById('evidence-blocks');
    
    const analysisPlaceholder = document.getElementById('analysis-placeholder');
    const analysisResults = document.getElementById('analysis-results');
    const gapsList = document.getElementById('analysis-gaps-list');
    const contradictionsList = document.getElementById('analysis-contradictions-list');
    const trendsList = document.getElementById('analysis-trends-list');
    
    const ideasPlaceholder = document.getElementById('ideas-placeholder');
    const ideasResults = document.getElementById('ideas-results');
    
    // Console reference
    const consoleLogs = document.getElementById('console-logs');
    AgentEngine.logContainer = consoleLogs;

    // Cache state
    let activeResearchData = null;
    let uploadedPdfs = [];

    // Load saved settings
    inputGeminiKey.value = localStorage.getItem('aetheria_gemini_key') || '';
    selectSearchLimit.value = localStorage.getItem('aetheria_search_limit') || '5';

    // 2. Tab Navigation Logic
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTabId = link.getAttribute('data-tab');
            
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
        });
    });

    // Helper to programmatically switch tabs
    function switchToTab(tabId) {
        const link = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
        if (link) link.click();
    }

    // 3. Settings Modal Toggle
    btnSettings.addEventListener('click', () => {
        modalSettings.style.display = 'flex';
    });

    btnCloseSettings.addEventListener('click', () => {
        modalSettings.style.display = 'none';
    });

    // Close when clicking overlay background
    modalSettings.addEventListener('click', (e) => {
        if (e.target === modalSettings) {
            modalSettings.style.display = 'none';
        }
    });

    btnSaveSettings.addEventListener('click', () => {
        localStorage.setItem('aetheria_gemini_key', inputGeminiKey.value.trim());
        localStorage.setItem('aetheria_search_limit', selectSearchLimit.value);
        modalSettings.style.display = 'none';
        AgentEngine.log("Settings saved successfully.", "system");
    });

    // 4. Console log clearing
    btnClearConsole.addEventListener('click', () => {
        AgentEngine.clearLogs();
    });

    // 5. PDF Upload Operations
    pdfTrigger.addEventListener('click', () => pdfInput.click());
    
    pdfInput.addEventListener('change', (e) => {
        handlePdfSelection(e.target.files);
    });

    // Drag and drop event listeners
    pdfDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfDropzone.classList.add('dragover');
    });

    pdfDropzone.addEventListener('dragleave', () => {
        pdfDropzone.classList.remove('dragover');
    });

    pdfDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handlePdfSelection(e.dataTransfer.files);
        }
    });

    function handlePdfSelection(files) {
        uploadedPdfs = [];
        for (let i = 0; i < files.length; i++) {
            if (files[i].type === 'application/pdf') {
                uploadedPdfs.push(files[i]);
                AgentEngine.log(`PDF loaded: ${files[i].name} (${Math.round(files[i].size / 1024)} KB)`, 'system');
            }
        }
        
        if (uploadedPdfs.length > 0) {
            pdfBadge.textContent = `${uploadedPdfs.length} file${uploadedPdfs.length > 1 ? 's' : ''}`;
            pdfBadge.style.display = 'inline-block';
        } else {
            pdfBadge.style.display = 'none';
        }
    }

    // 6. Begin Research Event
    btnStart.addEventListener('click', async () => {
        const query = inputQuery.value.trim();
        if (!query) {
            alert('Please enter a research question.');
            return;
        }

        // Disable input buttons during research
        btnStart.disabled = true;
        btnStart.style.opacity = '0.6';
        
        // Hide previous placeholders and results during reload
        resetResultPanes();
        switchToTab('tab-discovery');

        const limit = parseInt(selectSearchLimit.value);
        const options = {
            sources: {
                arxiv: sourceArxiv.checked,
                web: sourceWeb.checked,
                pdfs: uploadedPdfs.length > 0
            },
            pdfUploadedCount: uploadedPdfs.length,
            limit,
            geminiKey: inputGeminiKey.value.trim(),
            
            // Callback hooks as stages complete
            onPapersDiscovered: (papers) => {
                renderPapers(papers);
            },
            onRetrievalCompleted: (data) => {
                renderRetrieval(data);
            },
            onAnalysisCompleted: (data) => {
                renderAnalysis(data);
            },
            onIdeasCompleted: (data) => {
                renderIdeas(data);
                activeResearchData = data; // Cache for export
            }
        };

        try {
            await AgentEngine.runPipeline(query, options);
        } catch (error) {
            AgentEngine.log(`Pipeline error: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Re-enable start button
            btnStart.disabled = false;
            btnStart.style.opacity = '1';
        }
    });

    // Reset result elements between searches
    function resetResultPanes() {
        discoveryPlaceholder.style.display = 'flex';
        discoveryResults.style.display = 'none';
        discoveryResults.innerHTML = '';
        discoveryCount.textContent = '0 papers found';
        
        retrievalPlaceholder.style.display = 'flex';
        retrievalResults.style.display = 'none';
        retrievalSummaryText.textContent = '';
        comparisonTableBody.innerHTML = '';
        evidenceBlocks.innerHTML = '';
        
        analysisPlaceholder.style.display = 'flex';
        analysisResults.style.display = 'none';
        gapsList.innerHTML = '';
        contradictionsList.innerHTML = '';
        trendsList.innerHTML = '';
        
        ideasPlaceholder.style.display = 'flex';
        ideasResults.style.display = 'none';
        ideasResults.innerHTML = '';
        btnExport.style.display = 'none';
    }

    // 7. Output Render Functions
    function renderPapers(papers) {
        discoveryPlaceholder.style.display = 'none';
        discoveryResults.style.display = 'flex';
        discoveryCount.textContent = `${papers.length} paper${papers.length !== 1 ? 's' : ''} found`;
        
        papers.forEach(p => {
            const card = document.createElement('article');
            card.className = 'paper-card';
            
            const authorsList = p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : '');
            
            card.innerHTML = `
                <div class="paper-header">
                    <a href="${p.link}" target="_blank" class="paper-title">${p.title}</a>
                    <a href="${p.pdfLink}" target="_blank" class="badge" style="color: var(--color-primary); border-color: var(--color-primary);">PDF</a>
                </div>
                <div class="paper-meta">
                    <span>By: ${authorsList}</span>
                    <span>•</span>
                    <span>Published: ${p.published}</span>
                </div>
                <p class="paper-abstract">${p.summary}</p>
            `;
            discoveryResults.appendChild(card);
        });
    }

    function renderRetrieval(data) {
        retrievalPlaceholder.style.display = 'none';
        retrievalResults.style.display = 'flex';
        
        // Render summary text
        retrievalSummaryText.textContent = data.summary;
        
        // Render comparison table
        comparisonTableBody.innerHTML = '';
        data.comparison.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.paper}</strong></td>
                <td>${row.methodology}</td>
                <td>${row.contribution}</td>
                <td><span style="color: var(--color-text-muted); font-style: italic;">${row.limitation}</span></td>
            `;
            comparisonTableBody.appendChild(tr);
        });
        
        // Render evidence blocks
        evidenceBlocks.innerHTML = '';
        data.evidence.forEach(item => {
            const card = document.createElement('div');
            card.className = 'evidence-card';
            card.innerHTML = `
                <p class="evidence-fact">"${item.fact}"</p>
                <div class="evidence-source">— ${item.source}</div>
            `;
            evidenceBlocks.appendChild(card);
        });
    }

    function renderAnalysis(data) {
        analysisPlaceholder.style.display = 'none';
        analysisResults.style.display = 'grid';
        
        // Render Gaps
        gapsList.innerHTML = '';
        data.gaps.forEach(gap => {
            const card = document.createElement('div');
            card.className = 'analysis-card';
            card.innerHTML = `
                <h4>${gap.title}</h4>
                <p>${gap.desc}</p>
            `;
            gapsList.appendChild(card);
        });
        
        // Render Contradictions
        contradictionsList.innerHTML = '';
        data.contradictions.forEach(contra => {
            const card = document.createElement('div');
            card.className = 'analysis-card';
            card.innerHTML = `
                <h4>${contra.title}</h4>
                <p>${contra.desc}</p>
            `;
            contradictionsList.appendChild(card);
        });
        
        // Render Trends
        trendsList.innerHTML = '';
        data.trends.forEach(trend => {
            const card = document.createElement('div');
            card.className = 'analysis-card';
            card.innerHTML = `
                <h4>${trend.title}</h4>
                <p>${trend.desc}</p>
            `;
            trendsList.appendChild(card);
        });
    }

    function renderIdeas(data) {
        ideasPlaceholder.style.display = 'none';
        ideasResults.style.display = 'grid';
        btnExport.style.display = 'inline-flex';
        
        ideasResults.innerHTML = '';
        data.ideas.forEach(idea => {
            const card = document.createElement('div');
            card.className = 'idea-card';
            
            card.innerHTML = `
                <div class="idea-header">
                    <h3>${idea.title}</h3>
                    <span class="difficulty-badge">${idea.difficulty}</span>
                </div>
                <p class="idea-body"><strong>Impact:</strong> ${idea.impact}</p>
                <div class="idea-meta">
                    <div class="meta-row"><strong>Methodology:</strong> <span>${idea.methodology}</span></div>
                    ${idea.risk ? `<div class="meta-row" style="color: var(--color-orange);"><strong style="color: var(--color-orange);">Risk:</strong> <span>${idea.risk}</span></div>` : ''}
                </div>
            `;
            ideasResults.appendChild(card);
        });
    }

    // 8. Export Research Ideas as Markdown
    btnExport.addEventListener('click', () => {
        if (!activeResearchData) return;
        
        const query = inputQuery.value.trim();
        let markdown = `# Aetheria Research Agent: suggested directions\n`;
        markdown += `*Generated on: ${new Date().toLocaleString()}*\n`;
        markdown += `*Research Query:* "${query}"\n\n`;
        
        markdown += `## Executive Summary\n${activeResearchData.summary}\n\n`;
        
        markdown += `## Identified Gaps in Literature\n`;
        activeResearchData.gaps.forEach((g, idx) => {
            markdown += `### ${idx + 1}. ${g.title}\n${g.desc}\n\n`;
        });
        
        markdown += `## Conflicting Methodologies & Contradictions\n`;
        activeResearchData.contradictions.forEach((c, idx) => {
            markdown += `### ${idx + 1}. ${c.title}\n${c.desc}\n\n`;
        });
        
        markdown += `## Conceptual Research Trends\n`;
        activeResearchData.trends.forEach((t, idx) => {
            markdown += `### ${idx + 1}. ${t.title}\n${t.desc}\n\n`;
        });
        
        markdown += `## Proposed Research Ideas & Project Plans\n`;
        activeResearchData.ideas.forEach((idea, idx) => {
            markdown += `### ${idx + 1}. ${idea.title}\n`;
            markdown += `- **Difficulty Level:** ${idea.difficulty}\n`;
            markdown += `- **Methodology:** ${idea.methodology}\n`;
            markdown += `- **Expected Impact:** ${idea.impact}\n`;
            if (idea.risk) {
                markdown += `- **Potential Blockers & Risks:** ${idea.risk}\n`;
            }
            markdown += `\n`;
        });

        // Trigger file download in browser
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Aetheria_Research_Plan_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        AgentEngine.log("Successfully exported research plan as Markdown file.", "success");
    });
});
