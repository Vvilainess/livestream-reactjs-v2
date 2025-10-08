import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Film, Loader, StopCircle, Clock, RefreshCw, Download, ListChecks } from 'lucide-react'; // Thêm icon Download, ListChecks

// ==============================================================================
// CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS)
// ==============================================================================
// Định dạng thời gian hiển thị thân thiện
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    // Sử dụng locale 'vi-VN' và hourCycle 'h23' để có định dạng 24 giờ
    return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} - ${date.toLocaleDateString('vi-VN')}`;
};

// Trả về thông tin hiển thị (text, màu sắc, icon) dựa trên trạng thái
const getStatusDisplay = (status) => {
    const statuses = {
        LIVE: { text: 'ĐANG PHÁT', color: 'text-green-400', bg: 'bg-green-900/50', icon: <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span> },
        COMPLETED: { text: 'HOÀN TẤT', color: 'text-gray-400', bg: 'bg-gray-700/80', icon: null },
        FAILED: { text: 'THẤT BẠI', color: 'text-red-400', bg: 'bg-red-900/50', icon: null },
        PENDING: { text: 'CHỜ PHÁT', color: 'text-yellow-400', bg: 'bg-yellow-900/50', icon: null },
        STOPPING: { text: 'ĐANG DỪNG', color: 'text-orange-400', bg: 'bg-orange-900/50', icon: <Loader className="w-4 h-4 animate-spin" /> },
        RETRYING: { text: 'ĐANG KẾT NỐI LẠI', color: 'text-blue-400', bg: 'bg-blue-900/50', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
        DOWNLOADING_VIDEO: { text: 'ĐANG TẢI VIDEO', color: 'text-indigo-400', bg: 'bg-indigo-900/50', icon: <Download className="w-4 h-4 animate-bounce" /> }, // Trạng thái mới
        QUEUED_FOR_DOWNLOAD: { text: 'CHỜ TẢI VIDEO', color: 'text-purple-400', bg: 'bg-purple-900/50', icon: <ListChecks className="w-4 h-4 animate-pulse" /> } // Trạng thái mới
    };
    return statuses[status] || { text: 'KHÔNG XÁC ĐỊNH', color: 'text-gray-500', bg: 'bg-gray-800' };
};

// ==============================================================================
// COMPONENT StreamList
// ==============================================================================
const StreamList = ({ schedules, handleDelete, handleStop, socket }) => {
    const [showDebug, setShowDebug] = useState(false);
    const [processStats, setProcessStats] = useState(null);

    // Yêu cầu thống kê tiến trình từ backend
    const handleGetStats = () => {
        socket.emit('get_process_stats');
    };

    // Đăng ký listener cho 'process_stats' khi component mount
    useEffect(() => {
        socket.on('process_stats', (stats) => {
            setProcessStats(stats);
        });
        // Cleanup listener khi component unmount
        return () => socket.off('process_stats');
    }, [socket]); // socket là dependency vì nó được truyền từ props

    return (
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col border border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-100 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-400" /> Quản lý Luồng ({schedules.length})
                </h2>
                <button
                    onClick={() => { setShowDebug(!showDebug); if (!showDebug) handleGetStats(); }}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                >
                    {showDebug ? 'Ẩn' : 'Debug'}
                </button>
            </div>

            {/* Hiển thị thông tin Debug */}
            {showDebug && processStats && (
                <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded text-xs space-y-2 flex-shrink-0">
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Running Streams:</span> {processStats.running_streams_count}
                    </p>
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Active PIDs:</span> {Object.values(processStats.schedule_pids || {}).join(', ') || 'None'}
                    </p>
                    {processStats.retry_counts && Object.keys(processStats.retry_counts).length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-gray-300">Retry Times (seconds):</span> {JSON.stringify(processStats.retry_counts)}
                        </p>
                    )}
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Download Queue:</span> {processStats.download_queue_length} items
                    </p>
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Downloads In Progress:</span> {processStats.downloads_in_progress.join(', ') || 'None'}
                    </p>
                    {processStats.ffmpeg_processes?.length > 0 && (
                        <div>
                            <p className="font-semibold text-gray-300 mb-1">FFmpeg Processes ({processStats.ffmpeg_processes.length}):</p>
                            <div className="bg-black p-2 rounded font-mono text-[10px] text-green-400 max-h-32 overflow-y-auto">
                                {processStats.ffmpeg_processes.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Hiển thị danh sách lịch trình */}
            {!schedules.length ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 italic">Chưa có lịch livestream nào được tạo.</div>
            ) : (
                <div className="space-y-4 overflow-y-auto flex-1 mt-4 pr-2">
                    {schedules.map((schedule) => {
                        const statusDisplay = getStatusDisplay(schedule.status);
                        // Các trạng thái cho phép dừng
                        const canStop = ['LIVE', 'RETRYING', 'DOWNLOADING_VIDEO', 'QUEUED_FOR_DOWNLOAD'].includes(schedule.status);
                        // Các trạng thái cho phép xóa
                        const canDelete = ['PENDING', 'COMPLETED', 'FAILED', 'STOPPING', 'DOWNLOADING_VIDEO', 'QUEUED_FOR_DOWNLOAD'].includes(schedule.status);
                        const durationText = schedule.durationMinutes ? `${schedule.durationMinutes} phút` : 'Vô hạn';
                        const pid = processStats?.schedule_pids?.[schedule.id];
                        
                        return (
                            <div key={schedule.id} className="p-4 border border-gray-700 rounded-lg bg-gray-900 flex flex-col space-y-4">
                                <div className="flex justify-between items-start">
                                    <p className="text-lg font-bold text-gray-100 truncate flex items-center">
                                        {statusDisplay.icon && <span className="mr-3 pl-4">{statusDisplay.icon}</span>}
                                        {schedule.title}
                                        {showDebug && pid && (
                                            <span className="ml-2 text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-blue-400">
                                                PID:{pid}
                                            </span>
                                        )}
                                    </p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>{statusDisplay.text}</span>
                                </div>
                                <div className="text-sm text-gray-400 space-y-2 border-t border-gray-700/50 pt-3">
                                    <p className="flex items-center"><Clock size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">Phát lúc:</span> {formatDateTime(schedule.broadcastDateTime)}</p>
                                    {/* Thay đổi: Luôn hiển thị videoUrl nếu có, hoặc videoIdentifier nếu đã tải xong */}
                                    {(schedule.videoUrl || schedule.videoIdentifier) && (
                                        <p className="flex items-center"><Film size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">Nguồn:</span> <span className="font-mono truncate max-w-[calc(100%-120px)]">{schedule.videoIdentifier || schedule.videoUrl}</span></p>
                                    )}
                                    <p className="flex items-center"><Clock size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">Thời lượng:</span> {durationText}</p>
                                </div>
                                {/* Thông báo trạng thái đặc biệt */}
                                {schedule.status === 'RETRYING' && (
                                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-3 text-xs text-blue-300">
                                        <p className="flex items-center">
                                            <Loader size={14} className="mr-2 animate-spin" />
                                            Đang thử kết nối lại luồng... Hệ thống sẽ tự động retry.
                                        </p>
                                    </div>
                                )}
                                {schedule.status === 'QUEUED_FOR_DOWNLOAD' && (
                                    <div className="bg-purple-900/30 border border-purple-700/50 rounded-md p-3 text-xs text-purple-300">
                                        <p className="flex items-center">
                                            <ListChecks size={14} className="mr-2 animate-pulse" />
                                            Video đang chờ để được tải xuống.
                                        </p>
                                    </div>
                                )}
                                {schedule.status === 'DOWNLOADING_VIDEO' && (
                                    <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-md p-3 text-xs text-indigo-300">
                                        <p className="flex items-center">
                                            <Download size={14} className="mr-2 animate-bounce" />
                                            Đang tải video từ URL. Vui lòng chờ...
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end space-x-2 pt-2">
                                    {canStop && <button onClick={() => handleStop(schedule.id, schedule.title)} className="font-semibold py-1.5 px-3 rounded-md transition bg-yellow-600 hover:bg-yellow-700 text-white flex items-center text-xs"><StopCircle size={14} className="mr-1.5" /> Dừng</button>}
                                    {canDelete && <button onClick={() => handleDelete(schedule.id, schedule.title)} className="font-semibold py-1.5 px-3 rounded-md transition bg-red-600 hover:bg-red-700 text-white flex items-center text-xs"><Trash2 size={14} className="mr-1.5" /> Xóa</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StreamList;

