const fs = require('fs');
const file = 'frontend/src/components/MessagesPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Add sendingRef
if (!content.includes('const sendingRef = useRef(false);')) {
    content = content.replace(
        "const [sending, setSending] = useState(false);",
        "const [sending, setSending] = useState(false);\n    const sendingRef = useRef(false);"
    );
}

// 2. Update sendingRef when sending changes
// We'll just set it directly in handleSend for safety.
const searchHandleSendStart = "setSending(true);";
if (content.includes(searchHandleSendStart) && !content.includes("sendingRef.current = true;")) {
    content = content.replace(/setSending\(true\);/g, "setSending(true);\n            sendingRef.current = true;");
    content = content.replace(/setSending\(false\);/g, "setSending(false);\n            sendingRef.current = false;");
}

// 3. Prevent interval from running fetchThread if sendingRef is true
const intervalSearch = "if (activeConversationRef.current) {\n                fetchThread(activeConversationRef.current._id, { silent: true });\n            }";
if (content.includes(intervalSearch) && !content.includes("sendingRef.current")) {
    const intervalReplace = `if (activeConversationRef.current && !sendingRef.current) {\n                fetchThread(activeConversationRef.current._id, { silent: true });\n            }`;
    content = content.replace(intervalSearch, intervalReplace);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated MessagesPage.jsx');
