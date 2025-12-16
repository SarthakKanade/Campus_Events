import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Scan, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OrganizerScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState('');
    const [manualEventId, setManualEventId] = useState(''); // Just for demo, usually context or selected event
    const [loading, setLoading] = useState(false);

    // In a real app, organizer selects "Which Event" first. 
    // Simplified: We parse eventId from QR.

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } }
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            scanner.clear();
            handleCheckIn(decodedText);
        }

        function onScanFailure(error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const handleCheckIn = async (jsonString) => {
        setLoading(true);
        try {
            const data = JSON.parse(jsonString);
            const { eventId, userId } = data;

            await processCheckIn(eventId, userId);

        } catch (error) {
            console.error("Invalid QR Format", error);
            toast.error("Invalid QR Code format.");
            setLoading(false);
        }
    };

    const { user } = useAuth(); // Get user from context

    // ...

    const processCheckIn = async (eventId, userId) => {
        try {
            const config = { headers: { 'x-auth-token': user?.token || localStorage.getItem('token') } };
            const res = await axios.post('/api/events/scan', { eventId, userId }, config);

            setScanResult({
                success: true,
                studentName: res.data.studentName,
                time: new Date().toLocaleTimeString()
            });
            toast.success(`Welcome, ${res.data.studentName}!`);

        } catch (error) {
            console.error("Check-in failed", error);
            setScanResult({
                success: false,
                message: error.response?.data?.msg || "Check-in failed"
            });
            toast.error(error.response?.data?.msg || "Check-in failed");
        } finally {
            setLoading(false);
        }
    }

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            // Expecting JSON string for manual input to be exact copy
            const data = JSON.parse(manualId);
            await processCheckIn(data.eventId, data.userId);
            setManualId('');
        } catch (e) {
            // Maybe they entered raw ID? Let's assume demo copy-paste JSON
            toast.error("Invalid input. Please copy the FULL ticket code (JSON) starting with '{'.");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Scan className="w-6 h-6 text-indigo-600" /> Event Scanner
            </h1>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div id="reader"></div>
                <p className="text-center text-xs text-gray-400 mt-2">Point camera at student ticket</p>
            </div>

            {scanResult && (
                <div className={`p-4 rounded-lg border mb-6 ${scanResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3">
                        {scanResult.success ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                        <div>
                            <h3 className={`font-bold ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {scanResult.success ? "Check-in Successful" : "Access Denied"}
                            </h3>
                            {scanResult.success ? (
                                <p className="text-green-700 text-sm">Student: <strong>{scanResult.studentName}</strong></p>
                            ) : (
                                <p className="text-red-700 text-sm">{scanResult.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Manual Override</h4>
                <form onSubmit={handleManualSubmit}>
                    <input
                        type="text"
                        placeholder="Paste QR Data here..."
                        className="w-full text-sm p-3 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                        disabled={loading}
                    >
                        Verify Manual Entry
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrganizerScanner;
