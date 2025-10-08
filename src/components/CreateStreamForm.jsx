import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Loader } from 'lucide-react'; 

const CreateStreamForm = ({ handleSchedule, isScheduling }) => {
    const [formState, setFormState] = useState({
        title: '', 
        videoInput: '', // Luôn là URL video
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        streamKey: '', 
        rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
        durationType: 'infinite', 
        duration: 60,
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
        // Xóa lỗi ngay lập tức khi người dùng bắt đầu nhập
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const handleDurationTypeChange = (e) => {
        setFormState(prev => ({ ...prev, durationType: e.target.value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formState.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề.';
        if (!formState.videoInput.trim()) newErrors.videoInput = 'Vui lòng nhập URL video.';
        if (!formState.date) newErrors.date = 'Vui lòng chọn ngày phát.';
        if (!formState.time) newErrors.time = 'Vui lòng chọn giờ phát.';
        if (!formState.rtmpServer.trim()) newErrors.rtmpServer = 'Vui lòng nhập RTMP Server.';
        if (!formState.streamKey.trim()) newErrors.streamKey = 'Vui lòng nhập Stream Key.';
        if (formState.durationType === 'custom' && (!formState.duration || formState.duration <= 0)) {
            newErrors.duration = 'Vui lòng nhập thời lượng hợp lệ (phút).';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc và hợp lệ!');
            return;
        }
        
        handleSchedule(formState, (success) => {
            if (success) {
                // Reset form về trạng thái ban đầu sau khi tạo thành công
                setFormState(prev => ({
                    ...prev,
                    title: '',
                    videoInput: '', // Reset URL video
                    streamKey: '',
                    // Giữ lại ngày giờ và RTMP server mặc định/cuối cùng để tiện lợi
                    durationType: 'infinite',
                    duration: 60,
                }));
                setErrors({});
            }
            // Nếu không thành công, không reset form để người dùng có thể sửa lỗi
        });
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col border border-gray-700">
            <h2 className="text-xl font-bold text-gray-100 flex items-center border-b border-gray-700 pb-4 flex-shrink-0">
                <Plus className="w-6 h-6 mr-3 text-blue-400" /> Lập Lịch Livestream Mới
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="title" 
							value={formState.title} 
							onChange={handleChange} 
							placeholder="Tiêu đề..." 
							className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
					</div>
					<div>
                        <label htmlFor="videoInput" className="block text-sm font-medium text-gray-300 mb-1">URL Video... <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            id="videoInput" 
                            value={formState.videoInput} 
                            onChange={handleChange} 
                            placeholder="VD: https://drive.google.com/file..." 
                            className={`w-full px-3 py-2 border ${errors.videoInput ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                        />
                        {errors.videoInput && <p className="text-red-400 text-xs mt-1">{errors.videoInput}</p>}
					</div>
				</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày Phát <span className="text-red-400">*</span></label>
                        <input 
                            type="date" 
                            id="date" 
                            value={formState.date} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                        />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-1">Giờ Phát <span className="text-red-400">*</span></label>
                        <input 
                            type="time" 
                            id="time" 
                            value={formState.time} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border ${errors.time ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                        />
                        {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="rtmpServer" className="block text-sm font-medium text-gray-300 mb-1">RTMP Server <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="rtmpServer" 
							value={formState.rtmpServer} 
							onChange={handleChange} 
							placeholder="VD: rtmp://a.rtmp.youtube.com/live2" 
							className={`w-full px-3 py-2 border ${errors.rtmpServer ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.rtmpServer && <p className="text-red-400 text-xs mt-1">{errors.rtmpServer}</p>}
					</div>
					<div>
						<label htmlFor="streamKey" className="block text-sm font-medium text-gray-300 mb-1">Stream Key <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="streamKey" 
							value={formState.streamKey} 
							onChange={handleChange} 
							placeholder="Stream Key..." 
							className={`w-full px-3 py-2 border ${errors.streamKey ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.streamKey && <p className="text-red-400 text-xs mt-1">{errors.streamKey}</p>}
					</div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Thời Lượng Phát</label>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="durationType" 
                                value="infinite" 
                                checked={formState.durationType === 'infinite'}
                                onChange={handleDurationTypeChange}
                                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Tự động lặp vô hạn</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="durationType" 
                                value="custom" 
                                checked={formState.durationType === 'custom'}
                                onChange={handleDurationTypeChange}
                                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Thời gian tùy chọn</span>
                        </label>
                        
                        {formState.durationType === 'custom' && (
                            <div className="ml-7 mt-2">
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
                                    Thời lượng (phút) <span className="text-red-400">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    id="duration" 
                                    min="1"
                                    value={formState.duration} 
                                    onChange={handleChange} 
                                    placeholder="VD: 60" 
                                    className={`w-full px-3 py-2 border ${errors.duration ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                                />
                                {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
                                <p className="text-xs text-gray-500 mt-1">Video sẽ lặp lại cho đến khi hết thời gian</p>
                            </div>
                        )}
                    </div>
                </div>
            </form>
            <div className="pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                <button type="submit" onClick={handleSubmit} disabled={isScheduling} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isScheduling ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</> : <><Plus className="w-5 h-5 mr-2" /> Lên Lịch Ngay</>}
                </button>
            </div>
        </div>
    );
};

export default CreateStreamForm;