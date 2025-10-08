import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import { Plus, Calendar, StopCircle } from 'lucide-react'; // Import các icon cần thiết

import CreateStreamForm from './components/CreateStreamForm'; // Import component mới
import StreamList from './components/StreamList';       // Import component mới

// Khởi tạo kết nối Socket.IO bên ngoài component để tránh khởi tạo lại không cần thiết
const socket = io({ autoConnect: false });

const App = () => {
    const [schedules, setSchedules] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isScheduling, setIsScheduling] = useState(false);
    // Lưu trữ toastId cho các hành động cần cập nhật sau (ví dụ: dừng stream)
    const [actionToasts, setActionToasts] = useState({}); 
    const [activeTab, setActiveTab] = useState('create');

    useEffect(() => {
        // Kết nối Socket.IO khi component được mount
        socket.connect();

        // Xử lý sự kiện kết nối/ngắt kết nối
        socket.on('connect', () => { 
            setIsConnected(true); 
            toast.success('Đã kết nối tới server!'); 
        });
        socket.on('disconnect', () => { 
            setIsConnected(false); 
            toast.error('Mất kết nối tới server!'); 
        });

        // Xử lý cập nhật danh sách lịch trình từ server
        const handleBroadcastUpdate = (updatedSchedules) => {
            setSchedules(updatedSchedules);
            
            // Cập nhật trạng thái của các toast (ví dụ: khi stream dừng)
            setActionToasts(currentToasts => {
                const newToasts = {...currentToasts};
                let toastsChanged = false;
                
                Object.keys(currentToasts).forEach(scheduleId => {
                    const currentToastId = newToasts[scheduleId];
                    const updatedSchedule = updatedSchedules.find(s => s.id === scheduleId);
                    
                    if (updatedSchedule && updatedSchedule.status === 'COMPLETED') {
                        toast.success(`Đã dừng luồng "${updatedSchedule.title}" thành công!`, { id: currentToastId });
                        delete newToasts[scheduleId];
                        toastsChanged = true;
                    }
                });
                return toastsChanged ? newToasts : currentToasts;
            });
        };
        
        socket.on('broadcast_update', handleBroadcastUpdate);

        // Cleanup: Ngắt kết nối và loại bỏ listeners khi component unmount
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('broadcast_update', handleBroadcastUpdate);
            socket.disconnect();
        };
    }, []); // Dependency array rỗng đảm bảo hiệu ứng chỉ chạy một lần

    // Hàm xử lý việc tạo lịch trình mới
    const handleSchedule = (formState, callback) => {
        setIsScheduling(true);
        const toastId = toast.loading('Đang gửi và xác thực lịch trình...');

        const { date, time, duration, durationType, videoInput, ...rest } = formState; // videoInputType đã bị loại bỏ
        const combinedDateTime = new Date(`${date}T${time}:00`).toISOString();
        
        const payload = { 
            ...rest, 
            broadcastDateTime: combinedDateTime, 
            durationMinutes: durationType === 'custom' ? parseInt(duration, 10) : null,
            videoUrl: videoInput // Luôn gửi videoInput dưới dạng videoUrl
        };

        // Loại bỏ videoIdentifier vì không còn sử dụng
        delete payload.videoIdentifier; 

        socket.emit('create_schedule', payload, (response) => {
            setIsScheduling(false);
            if (response && response.success) {
                toast.success(`Đã lên lịch "${formState.title}" thành công!`, { id: toastId });
                callback(true); 
                setActiveTab('manage'); // Chuyển sang tab quản lý sau khi tạo thành công
            } else {
                const errorMessage = response ? response.error : 'Không nhận được phản hồi từ server.';
                toast.error(`Lỗi: ${errorMessage}`, { id: toastId, duration: 5000 });
                callback(false);
            }
        });
    };

    // Hàm xử lý việc dừng một lịch trình đang chạy
    const handleStop = (id, title) => {
        if (!window.confirm(`Bạn có chắc muốn DỪNG livestream "${title}" không?`)) return;
        const toastId = toast.loading(`Đang gửi yêu cầu dừng "${title}"...`);
        setActionToasts(prev => ({ ...prev, [id]: toastId })); // Lưu toastId để cập nhật sau
        socket.emit('stop_schedule', { id });
    };

    // Hàm xử lý việc xóa một lịch trình
    const handleDelete = (id, title) => {
        if (!window.confirm(`Bạn có chắc muốn XÓA lịch trình "${title}" không?`)) return;
        toast.promise(
             new Promise(resolve => {
                socket.emit('delete_schedule', { id });
                setTimeout(resolve, 500); // Đợi một chút để server xử lý
             }), { loading: `Đang xóa "${title}"...`, success: `Đã xóa "${title}".`, error: 'Không thể xóa.' }
        );
    };

    // Hàm xử lý việc dừng khẩn cấp tất cả các luồng
    const handleEmergencyStop = () => {
        if (!window.confirm('⚠️ CẢNH BÁO: Dừng KHẨN CẤP tất cả luồng?\n\nHành động này sẽ:\n- Dừng TẤT CẢ luồng đang phát\n- Kill mọi process FFmpeg\n- Không thể hoàn tác\n\nBạn có chắc chắn?')) return;
        
        toast.promise(
            new Promise(resolve => {
                socket.emit('emergency_stop_all');
                setTimeout(resolve, 1000); // Đợi một chút để server xử lý
            }),
            {
                loading: '🚨 Đang dừng khẩn cấp tất cả luồng...',
                success: '✅ Đã dừng khẩn cấp tất cả luồng!',
                error: '❌ Lỗi khi dừng khẩn cấp'
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-gray-900 text-gray-100 font-sans flex flex-col">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb' } }} />
            
            <header className="w-full p-4 border-b border-gray-700/50 bg-gray-900 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Youtube Livestream Manager</h1>
                    {schedules.some(s => ['LIVE', 'RETRYING', 'DOWNLOADING_VIDEO', 'QUEUED_FOR_DOWNLOAD'].includes(s.status)) && (
                        <button
                            onClick={handleEmergencyStop}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition flex items-center space-x-2 text-sm"
                        >
                            <StopCircle size={16} />
                            <span>Dừng Khẩn Cấp Tất Cả</span>
                        </button>
                    )}
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-700/50 bg-gray-800/50 px-4 md:px-6 lg:px-8">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'create'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                            }`}
                        >
                            <Plus className="w-4 h-4 inline-block mr-2" />
                            Tạo Mới
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'manage'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline-block mr-2" />
                            Quản Lý ({schedules.length})
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
                    {activeTab === 'create' ? (
                        <div className="h-full max-w-4xl mx-auto">
                            {/* Truyền `socket` xuống để component con có thể gửi `get_process_stats` */}
                            <CreateStreamForm handleSchedule={handleSchedule} isScheduling={isScheduling} />
                        </div>
                    ) : (
                        <div className="h-full max-w-6xl mx-auto">
                            {/* Truyền `socket` xuống để component con có thể gửi `get_process_stats` */}
                            <StreamList schedules={schedules} handleDelete={handleDelete} handleStop={handleStop} socket={socket} />
                        </div>
                    )}
                </div>
            </main>
            
            <footer className="w-full p-3 border-t border-gray-700/50 bg-gray-900 flex-shrink-0">
                <p className="text-center text-xs text-gray-500">
                    Trạng thái kết nối: 
                    <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {isConnected ? ' ● Connected' : ' ● Disconnected'}
                    </span>
                </p>
            </footer>
        </div>
    );
};

export default App;