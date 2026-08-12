/**
 * Pipeline Manager for Aetheria Research Agent
 * Manages states, classes, and animations of SVG flowchart nodes and connector paths
 */

const PipelineManager = {
    // Maps node IDs to their DOM elements
    nodes: {
        'user-question': document.getElementById('node-user-question'),
        'research-agent': document.getElementById('node-research-agent'),
        'paper-discovery': document.getElementById('node-paper-discovery'),
        'web-search': document.getElementById('node-web-search'),
        'local-pdfs': document.getElementById('node-local-pdfs'),
        'doc-processing': document.getElementById('node-doc-processing'),
        'semantic-retrieval': document.getElementById('node-semantic-retrieval'),
        'summary': document.getElementById('node-summary'),
        'comparison': document.getElementById('node-comparison'),
        'evidence': document.getElementById('node-evidence'),
        'research-analysis': document.getElementById('node-research-analysis'),
        'gap-detection': document.getElementById('node-gap-detection'),
        'contradictions': document.getElementById('node-contradictions'),
        'trends': document.getElementById('node-trends'),
        'research-opportunities': document.getElementById('node-research-opportunities'),
        'suggested-ideas': document.getElementById('node-suggested-ideas')
    },

    // Maps path IDs to their DOM elements
    connectors: {
        'input-agent': document.getElementById('path-input-agent'),
        
        'agent-arxiv': document.getElementById('path-agent-arxiv'),
        'agent-web': document.getElementById('path-agent-web'),
        'agent-pdfs': document.getElementById('path-agent-pdfs'),
        
        'arxiv-proc': document.getElementById('path-arxiv-proc'),
        'web-proc': document.getElementById('path-web-proc'),
        'pdfs-proc': document.getElementById('path-pdfs-proc'),
        
        'proc-retrieval': document.getElementById('path-proc-retrieval'),
        
        'retrieval-summary': document.getElementById('path-retrieval-summary'),
        'retrieval-comparison': document.getElementById('path-retrieval-comparison'),
        'retrieval-evidence': document.getElementById('path-retrieval-evidence'),
        
        'summary-analysis': document.getElementById('path-summary-analysis'),
        'comparison-analysis': document.getElementById('path-comparison-analysis'),
        'evidence-analysis': document.getElementById('path-evidence-analysis'),
        
        'analysis-gap': document.getElementById('path-analysis-gap'),
        'analysis-contra': document.getElementById('path-analysis-contra'),
        'analysis-trends': document.getElementById('path-analysis-trends'),
        
        'gap-opp': document.getElementById('path-gap-opp'),
        'contra-opp': document.getElementById('path-contra-opp'),
        'trends-opp': document.getElementById('path-trends-opp'),
        
        'opp-ideas': document.getElementById('path-opp-ideas')
    },

    /**
     * Set the state of a node ('idle', 'active', 'completed')
     */
    setNodeState(nodeId, state) {
        const node = this.nodes[nodeId];
        if (node) {
            node.setAttribute('data-state', state);
        }
    },

    /**
     * Set the state of a connection path ('idle', 'active', 'completed')
     */
    setConnectorState(connectorId, state) {
        const path = this.connectors[connectorId];
        if (path) {
            path.classList.remove('active', 'completed');
            if (state === 'active') {
                path.classList.add('active');
            } else if (state === 'completed') {
                path.classList.add('completed');
            }
        }
    },

    /**
     * Reset all nodes and connectors to idle
     */
    reset() {
        Object.keys(this.nodes).forEach(nodeId => {
            this.setNodeState(nodeId, 'idle');
        });
        Object.keys(this.connectors).forEach(connId => {
            this.setConnectorState(connId, 'idle');
        });
    },

    /**
     * Animate transition between a start node, connector, and end node
     */
    transition(startNodeId, connectorIds, endNodeIds, duration = 800) {
        return new Promise((resolve) => {
            // Complete starting node
            if (startNodeId) {
                this.setNodeState(startNodeId, 'completed');
            }
            
            // Activate connectors
            if (connectorIds) {
                const conns = Array.isArray(connectorIds) ? connectorIds : [connectorIds];
                conns.forEach(c => this.setConnectorState(c, 'active'));
            }
            
            setTimeout(() => {
                // Complete connectors
                if (connectorIds) {
                    const conns = Array.isArray(connectorIds) ? connectorIds : [connectorIds];
                    conns.forEach(c => this.setConnectorState(c, 'completed'));
                }
                
                // Activate end nodes
                if (endNodeIds) {
                    const ends = Array.isArray(endNodeIds) ? endNodeIds : [endNodeIds];
                    ends.forEach(n => this.setNodeState(n, 'active'));
                }
                resolve();
            }, duration);
        });
    }
};
