const fs = require('fs');
const file = 'frontend/src/components/EmployeeDashboard/MyTeamSection.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Update MemberCard to include onReportClick
const memberCardDef = "const MemberCard = ({ member, isLead, index, currentUserIsLead, onReviewClick }) => {";
if (content.includes("onAwardClick") && !content.includes("onReportClick")) {
    content = content.replace(
        "const MemberCard = ({ member, isLead, index, currentUserIsLead, onReviewClick, onAwardClick }) => {",
        "const MemberCard = ({ member, isLead, index, currentUserIsLead, onReviewClick, onReportClick }) => {"
    );
}

// 2. Add the Report button next to the Review button
const reviewBtnHTML = `<button 
                                onClick={() => onReviewClick(member)}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded transition-colors"
                            >
                                + Review
                            </button>`;
if (content.includes(reviewBtnHTML) && !content.includes("AlertTriangle size={10}")) {
    content = content.replace(
        reviewBtnHTML,
        reviewBtnHTML + `\n                            <button 
                                onClick={() => onReportClick(member)}
                                className="text-[10px] flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded transition-colors"
                            >
                                <AlertTriangle size={10} /> Report
                            </button>`
    );
}

// 3. Update ReportModal to take initialMember
if (content.includes("const ReportModal = ({ members, onClose, onSuccess }) => {")) {
    content = content.replace(
        "const ReportModal = ({ members, onClose, onSuccess }) => {",
        "const ReportModal = ({ members, onClose, onSuccess, initialMember }) => {"
    );
    
    // Add useEffect to populate initialMember
    content = content.replace(
        "const [submitted, setSubmitted] = useState(false);",
        "const [submitted, setSubmitted] = useState(false);\n\n    useEffect(() => {\n        if (initialMember) {\n            setForm(prev => ({ ...prev, agentId: initialMember._id || initialMember.id, agentName: initialMember.name }));\n        }\n    }, [initialMember]);"
    );
}

// 4. Update the state in MyTeamSection
if (content.includes("const [showReportModal, setShowReportModal] = useState(false);")) {
    // Keep it, but we might need a selected member
    if (!content.includes("const [reportMember, setReportMember] = useState(null);")) {
        content = content.replace(
            "const [showReportModal, setShowReportModal] = useState(false);",
            "const [showReportModal, setShowReportModal] = useState(false);\n    const [reportMember, setReportMember] = useState(null);"
        );
    }
}

// 5. Render ReportModal with initialMember
if (content.includes("<ReportModal")) {
    content = content.replace(
        "<ReportModal",
        "<ReportModal\n                    initialMember={reportMember}"
    );
    // When closing, reset reportMember
    content = content.replace(
        "onClose={() => setShowReportModal(false)}",
        "onClose={() => { setShowReportModal(false); setReportMember(null); }}"
    );
}

// 6. Update MemberCard instances
if (content.includes("<MemberCard")) {
    content = content.replace(
        "onReviewClick={setReviewMember}",
        "onReviewClick={setReviewMember}\n                            onReportClick={(m) => { setReportMember(m); setShowReportModal(true); }}"
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added Report button and initialMember to ReportModal.');
