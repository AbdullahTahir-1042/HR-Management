const fs = require('fs');
const file = 'frontend/src/components/HRDashboard/IncrementReviewPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to \n to make string replacement reliable
content = content.replace(/\r\n/g, '\n');

// 1. Add import
if (!content.includes('import PerformanceReviewModal')) {
    content = content.replace(
        "import RestoreCardModal from './RestoreCardModal';",
        "import RestoreCardModal from './RestoreCardModal';\nimport PerformanceReviewModal from '../EmployeeDashboard/PerformanceReviewModal';"
    );
}

// 2. Add showReviewModal state
if (!content.includes('const [showReviewModal, setShowReviewModal]')) {
    content = content.replace(
        "const [loadingRev, setLoadingRev] = useState(true);",
        "const [loadingRev, setLoadingRev] = useState(true);\n    const [showReviewModal, setShowReviewModal] = useState(false);"
    );
}

// 3. Add "Add Review" button
const searchStr = `<Star size={16} /> Performance Review History
                            </h3>`;
if (content.includes(searchStr) && !content.includes('Add Review')) {
    const replaceStr = `<Star size={16} /> Performance Review History
                            </h3>
                            <button onClick={() => setShowReviewModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all">
                                <Plus size={14} /> Add Review
                            </button>`;
    content = content.replace(searchStr, replaceStr);
}

// 4. Add modal rendering at the bottom
const bottomStr = `</AnimatePresence>
        </div>
    );
};`;
if (content.includes(bottomStr) && !content.includes('<PerformanceReviewModal')) {
    const bottomReplace = `</AnimatePresence>

            {showReviewModal && (
                <PerformanceReviewModal
                    employee={employee}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => { setShowReviewModal(false); fetchReviews(); fetchSummary(); }}
                />
            )}
        </div>
    );
};`;
    content = content.replace(bottomStr, bottomReplace);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated IncrementReviewPage.jsx');
