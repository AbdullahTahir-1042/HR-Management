const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/EmployeeDashboard.jsx', 'utf8');

const replacement = `
    const handleConfirmAction = async () => {
        if (confirmModal.type === 'checkIn' || confirmModal.type === 'checkOut') {
            setIsLocationFetching(true);

            if (!navigator.geolocation) {
                setIsLocationFetching(false);
                return toast.error('Geolocation is not supported by your browser.');
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const endpoint = confirmModal.type === 'checkIn' ? '/attendance/check-in' : '/attendance/check-out';
                        await apiClient.post(endpoint, {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                        fetchTodayAttendance();
                        fetchAttendanceHistory();
                        setConfirmModal({ isOpen: false, type: null });
                        toast.success(\`Successfully \${confirmModal.type === 'checkIn' ? 'checked in' : 'checked out'}!\`);
                    } catch (err) {
                        toast.error(err.response?.data?.msg || 'Error recording attendance');
                    } finally {
                        setIsLocationFetching(false);
                    }
                },
                (error) => {
                    setIsLocationFetching(false);
                    let msg = 'Failed to retrieve location.';
                    if (error.code === 1) msg = 'Location access denied. Please allow location access in your browser.';
                    if (error.code === 2) msg = 'Position unavailable.';
                    if (error.code === 3) msg = 'Location request timed out.';
                    toast.error(msg);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };
`;

const functionStartRegex = /const handleConfirmAction = async \(\) => \{/;
const functionContentEndStr = `    };

    // Auto-fetch data when user changes`;

const split1 = content.split(functionStartRegex);
if (split1.length === 2) {
    const split2 = split1[1].split(functionContentEndStr);
    if (split2.length >= 2) {
        content = split1[0] + replacement.trim() + '\n\n    // Auto-fetch data when user changes' + split2.slice(1).join(functionContentEndStr);
        fs.writeFileSync('frontend/src/pages/EmployeeDashboard.jsx', content);
        console.log('Fixed EmployeeDashboard.jsx checkOut logic');
    }
}
