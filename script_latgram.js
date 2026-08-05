(function() {
    const input = document.getElementById('search-input');
    const button = document.getElementById('search-button');
    const content = document.getElementById('searchable-content');
    let currentMatchIndex = -1;
    let matches = [];
    let openedDetails = [];
    function clearHighlights() {
        const marks = content.querySelectorAll('mark');
        marks.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }
    function closeSearchOpenedDetails() {
        openedDetails.forEach(detail => {
            detail.open = false;
        });
        openedDetails = [];
    }
    function openAncestorDetails(element) {
        const opened = [];
        let parent = element.parentElement;
        while (parent) {
            if (parent.tagName === 'DETAILS') {
                if (!parent.open) {
                    parent.open = true;
                    opened.push(parent);
                }
            }
            parent = parent.parentElement;
        }
        return opened;
    }
    function highlightText(query) {
        closeSearchOpenedDetails();
        clearHighlights();
        if (!query.trim()) {
            matches = [];
            currentMatchIndex = -1;
            return;
        }
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedQuery, 'gi');
        const testRegex = new RegExp(escapedQuery, 'i');
        const walker = document.createTreeWalker(
            content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentNode.tagName === 'SCRIPT' ||
                        node.parentNode.tagName === 'STYLE' ||
                        node.parentNode.classList.contains('search-container')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return testRegex.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                }
            }
        );
        let node;
        const nodesToProcess = [];
        while ((node = walker.nextNode())) {
            nodesToProcess.push(node);
        }
        nodesToProcess.forEach(textNode => {
            const parent = textNode.parentNode;
            const frag = document.createDocumentFragment();
            let text = textNode.textContent;
            let lastIndex = 0;
            searchRegex.lastIndex = 0;
            let match;
            while ((match = searchRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                const mark = document.createElement('mark');
                mark.textContent = match[0];
                frag.appendChild(mark);
                lastIndex = searchRegex.lastIndex;
                if (match[0].length === 0) searchRegex.lastIndex++;
            }
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            parent.replaceChild(frag, textNode);
        });
        matches = Array.from(content.querySelectorAll('mark'));
        currentMatchIndex = -1;
        const newlyOpened = [];
        matches.forEach(mark => {
            const opened = openAncestorDetails(mark);
            opened.forEach(detail => {
                if (!newlyOpened.includes(detail)) {
                    newlyOpened.push(detail);
                }
            });
        });
        openedDetails = newlyOpened;
    }
    function goToNextMatch() {
        if (matches.length === 0) return;
        currentMatchIndex = (currentMatchIndex + 1) % matches.length;
        const match = matches[currentMatchIndex];
        openAncestorDetails(match);
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    input.addEventListener('input', function() {
        highlightText(this.value);
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (matches.length > 0) {
                goToNextMatch();
            }
        }
    });
    button.addEventListener('click', function() {
        highlightText(input.value);
        if (matches.length > 0) {
            goToNextMatch();
        }
        input.focus();
    });
})();
