const fs = require('fs');
const file = 'frontend/src/components/MessagesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Add clientKeyMap
if (!content.includes('const clientKeyMap = useRef(new Map());')) {
    content = content.replace(
        "const sendingRef = useRef(false);",
        "const sendingRef = useRef(false);\n    const clientKeyMap = useRef(new Map());"
    );
}

// 2. Set clientKeyMap in handleSend
const handleSendSet = "setMessages(prev => prev.map(m => (m._id === tempId ? res.data : m)));";
if (content.includes(handleSendSet) && !content.includes('clientKeyMap.current.set(res.data._id, tempId);')) {
    content = content.replace(
        handleSendSet,
        "clientKeyMap.current.set(res.data._id, tempId);\n            " + handleSendSet
    );
}

// 3. Use clientKeyMap in render
const renderKey = 'key={msg._id}';
const newRenderKey = 'key={clientKeyMap.current.get(msg._id) || msg._id}';
if (content.includes(renderKey)) {
    content = content.replace(renderKey, newRenderKey);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated MessagesPage.jsx with clientKeyMap');
