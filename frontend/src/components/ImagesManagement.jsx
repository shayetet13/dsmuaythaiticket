import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Edit2, Save, X, Plus, Upload, XCircle, Video, ChevronUp, ChevronDown } from 'lucide-react';
import { getAllData, updateHeroImage, updateHighlight, addHighlight, deleteHighlight, updateStadium, updateUpcomingFightsBackground, updateBookingBackground, getStadiums, getStadiumHighlights, updateStadiumHighlights, getStadiumHighlightImages, createStadiumHighlightImage, updateStadiumHighlightImage, deleteStadiumHighlightImage, reorderStadiumHighlightImages, getStadiumDescriptions, updateStadiumDescription } from '../db/imagesDb';
import { compressImage, compressImageToExactSize, validateImage } from '../utils/imageHelpers';
import axios from 'axios';
import { API_URL, getAdminApiKey } from '../config/api.js';

// Helper function to convert scheduleDays array to schedule text
const generateScheduleText = (scheduleDays) => {
  if (!scheduleDays || scheduleDays.length === 0) {
    return { th: '', en: '' };
  }

  const dayNamesTh = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayNamesEn = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  
  // Sort days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const sortedDays = [...scheduleDays].sort((a, b) => a - b);
  
  // Check if all 7 days
  if (sortedDays.length === 7 && sortedDays.every((day, idx) => day === idx)) {
    return {
      th: 'ทุกวัน / จันทร์ - อาทิตย์',
      en: 'EVERY DAY / MONDAY - SUNDAY'
    };
  }
  
  // Generate day names
  const dayNamesThList = sortedDays.map(day => dayNamesTh[day]);
  const dayNamesEnList = sortedDays.map(day => dayNamesEn[day]);
  
  return {
    th: `ทุกวัน${dayNamesThList.join(' / ')}`,
    en: `EVERY ${dayNamesEnList.join(' / ')}`
  };
};

const ImagesManagement = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [data, setData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [videos, setVideos] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadiumId, setSelectedStadiumId] = useState(null);
  const [stadiumHighlightsMap, setStadiumHighlightsMap] = useState({});
  const [stadiumHighlightSelectedIds, setStadiumHighlightSelectedIds] = useState([]);
  const [stadiumHighlightImagesMap, setStadiumHighlightImagesMap] = useState({});
  const [stadiumDescriptionsMap, setStadiumDescriptionsMap] = useState({});
  const [descStadiumId, setDescStadiumId] = useState(null);
  const [descEditForm, setDescEditForm] = useState(null);

  useEffect(() => {
    loadData();
    if (activeSection === 'videos') {
      loadStadiums();
    }
    if (activeSection === 'stadium-highlights') {
      loadStadiumHighlightImages();
    }
    if (activeSection === 'stadium-descriptions') {
      loadStadiumDescriptions();
    }
  }, [activeSection]);

  const loadStadiumDescriptions = async () => {
    try {
      const map = await getStadiumDescriptions();
      setStadiumDescriptionsMap(map || {});
    } catch (error) {
      console.error('Error loading stadium descriptions:', error);
      setStadiumDescriptionsMap({});
    }
  };

  useEffect(() => {
    if (activeSection === 'videos' && selectedStadiumId) {
      loadVideos();
    } else if (activeSection === 'videos') {
      setVideos([]);
    }
  }, [activeSection, selectedStadiumId]);

  useEffect(() => {
    if (activeSection === 'stadium-highlights' && selectedStadiumId) {
      const ids = stadiumHighlightsMap[selectedStadiumId] || [];
      setStadiumHighlightSelectedIds(ids);
    }
  }, [activeSection, selectedStadiumId, stadiumHighlightsMap]);

  useEffect(() => {
    if (activeSection === 'stadium-descriptions' && !descStadiumId && data?.stadiums?.length > 0) {
      setDescStadiumId(data.stadiums[0].id);
    }
  }, [activeSection, descStadiumId, data?.stadiums]);

  const loadStadiumHighlights = async () => {
    try {
      const map = await getStadiumHighlights();
      setStadiumHighlightsMap(map || {});
    } catch (error) {
      console.error('Error loading stadium highlights:', error);
      setStadiumHighlightsMap({});
    }
  };

  const loadStadiumHighlightImages = async () => {
    try {
      const map = await getStadiumHighlightImages();
      setStadiumHighlightImagesMap(map || {});
    } catch (error) {
      console.error('Error loading stadium highlight images:', error);
      setStadiumHighlightImagesMap({});
    }
  };

  const loadData = async () => {
    try {
      const allData = await getAllData();
      setData(allData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadStadiums = async () => {
    try {
      const stadiumsData = await getStadiums('th');
      setStadiums(stadiumsData);
      if (stadiumsData.length > 0 && !selectedStadiumId) {
        setSelectedStadiumId(stadiumsData[0].id);
      }
    } catch (error) {
      console.error('Error loading stadiums:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการโหลดสนาม');
    }
  };

  const loadVideos = async () => {
    if (!selectedStadiumId) {
      setVideos([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/booking-videos/all/${selectedStadiumId}`, {
        headers: {
          'X-API-Key': getAdminApiKey()
        }
      });
      setVideos(response.data);
    } catch (error) {
      console.error('Error loading videos:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการโหลดวิดีโอ');
    }
  };

  // Helper function to convert YouTube/Vimeo URLs to embed URLs
  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed') || url.includes('youtu.be/embed') || url.includes('player.vimeo.com')) {
      return url;
    }
    
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Return original URL if not YouTube/Vimeo (assume it's already an embed URL or direct video URL)
    return url;
  };

  const handleVideoSave = async () => {
    try {
      if (!selectedStadiumId) {
        showMessage('error', 'กรุณาเลือกสนามก่อน');
        return;
      }
      if (!editForm.video_url) {
        showMessage('error', 'กรุณากรอก Video URL');
        return;
      }

      const videoData = {
        ...editForm,
        stadium_id: selectedStadiumId,
        title: null // ไม่ใช้ title แล้ว
      };

      if (editingId) {
        // Update existing video
        await axios.put(`${API_URL}/booking-videos/${editingId}`, videoData, {
          headers: {
            'X-API-Key': sessionStorage.getItem('admin-api-key') || ''
          }
        });
        showMessage('success', 'อัพเดทวิดีโอสำเร็จ');
      } else {
        // Create new video
        await axios.post(`${API_URL}/booking-videos`, videoData, {
          headers: {
            'X-API-Key': getAdminApiKey()
          }
        });
        showMessage('success', 'เพิ่มวิดีโอสำเร็จ');
      }

      setEditingId(null);
      setEditForm({});
      await loadVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      showMessage('error', error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกวิดีโอ');
    }
  };

  const handleVideoDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/booking-videos/${id}`, {
        headers: {
          'X-API-Key': getAdminApiKey()
        }
      });
      showMessage('success', 'ลบวิดีโอสำเร็จ');
      await loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการลบวิดีโอ');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // ✅ Image compression moved to utils/imageHelpers.js (imported above)

  const sections = [
    { id: 'hero', label: 'Hero Image' },
    { id: 'upcoming', label: 'Upcoming Fights Background' },
    { id: 'booking', label: 'จัดการพื้นหลัง booking' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'stadium-highlights', label: 'จัดการ highlight สนาม' },
    { id: 'stadium-descriptions', label: 'คำบรรยาย' },
    { id: 'logos', label: 'Stadium Logos' },
    { id: 'videos', label: 'จัดการวิดีโอ', icon: Video }
  ];

  // Hero Image Management
  const handleHeroSave = async () => {
    try {
      if (!editForm.image) {
        showMessage('error', 'กรุณาเลือกรูปภาพหรือกรอก Image Path');
        return;
      }
      
      const result = await updateHeroImage(
        editForm.image, 
        editForm.alt || 'Muay Thai',
        editForm.fallback || '/images/hero/World class fighters.webp'
      );
      if (result) {
        showMessage('success', 'อัพเดท Hero Image สำเร็จ');
        setEditingId(null);
        setEditForm({});
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
      }
    } catch (error) {
      console.error('Error saving hero image:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
    }
  };

  // Upcoming Fights Background Management
  const handleUpcomingBackgroundSave = async () => {
    try {
      const result = await updateUpcomingFightsBackground(editForm.image, editForm.fallback);
      if (result) {
        showMessage('success', 'อัพเดท Upcoming Fights Background สำเร็จ');
        setEditingId(null);
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
      }
    } catch (error) {
      console.error('Error saving upcoming fights background:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
    }
  };

  // Booking Background Management
  const handleBookingBackgroundSave = async () => {
    try {
      const result = await updateBookingBackground(editForm.image, editForm.fallback);
      if (result) {
        showMessage('success', 'อัพเดท Booking Background สำเร็จ');
        setEditingId(null);
        await loadData();
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
      }
    } catch (error) {
      console.error('Error saving booking background:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
    }
  };

  // Highlight Management
  const handleHighlightSave = async (id) => {
    try {
      if (id) {
        // Update existing
        const result = await updateHighlight(id, editForm);
        if (result) {
          showMessage('success', 'อัพเดท Highlight สำเร็จ');
          setEditingId(null);
          setEditForm({});
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
        }
      } else {
        // Add new - check limit first
        if (data.highlights.length >= 9) {
          showMessage('error', 'ไม่สามารถเพิ่ม Highlight ได้เกิน 9 รายการ');
          return;
        }
        const result = await addHighlight(editForm);
        if (result) {
          showMessage('success', 'เพิ่ม Highlight สำเร็จ');
          setEditingId(null);
          setEditForm({});
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่ม');
        }
      }
    } catch (error) {
      console.error('Error saving highlight:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleHighlightDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Highlight นี้?')) {
      try {
        const result = await deleteHighlight(id);
        if (result) {
          showMessage('success', 'ลบ Highlight สำเร็จ');
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
        }
      } catch (error) {
        console.error('Error deleting highlight:', error);
        showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  if (!data) {
    return <div className="text-center text-white py-8">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div>
      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Section Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mb-4 md:mb-6">
        <div className="flex flex-wrap gap-2 p-3 md:p-4 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setEditingId(null);
              }}
              className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                activeSection === section.id
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Image Section */}
      {activeSection === 'hero' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-black text-white mb-3 md:mb-4 uppercase">Hero Image</h3>
          {editingId === 'hero' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Path หรือ Base64</label>
                <input
                  type="text"
                  value={editForm.image || data.hero.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/World class fighters.webp"
                />
                <p className="text-xs text-gray-400 mt-1">หรืออัพโหลดไฟล์ภาพด้านล่าง</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">อัพโหลดภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        // Validate image
                        const validation = validateImage(file, 10);
                        if (!validation.valid) {
                          showMessage('error', validation.error);
                          return;
                        }
                        
                        // Compress and convert to WebP
                        const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
                        setEditForm({ ...editForm, image: compressedBase64 });
                        showMessage('success', 'อัพโหลดภาพสำเร็จ (จะถูกแปลงเป็น WebP อัตโนมัติ)');
                      } catch (error) {
                        console.error('Error compressing image:', error);
                        showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                      }
                    }
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                />
              </div>
              {editForm.image && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <img
                    src={editForm.image}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Alt Text</label>
                <input
                  type="text"
                  value={editForm.alt || data.hero.alt}
                  onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fallback Image Path (ถ้าภาพหลักโหลดไม่ได้)</label>
                <input
                  type="text"
                  value={editForm.fallback || data.hero.fallback || '/images/hero/World class fighters.webp'}
                  onChange={(e) => setEditForm({ ...editForm, fallback: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/World class fighters.webp"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleHeroSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Save className="w-4 h-4" /> บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <img
                  src={data.hero.image}
                  alt={data.hero.alt}
                  className="max-w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = data.hero.fallback || '/images/hero/World class fighters.webp';
                  }}
                />
                <p className="text-gray-300"><strong>Path:</strong> {data.hero.image?.substring(0, 100)}{data.hero.image?.length > 100 ? '...' : ''}</p>
                <p className="text-gray-300"><strong>Alt:</strong> {data.hero.alt}</p>
                {data.hero.fallback && (
                  <p className="text-gray-300"><strong>Fallback:</strong> {data.hero.fallback}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingId('hero');
                  setEditForm({ image: data.hero.image, alt: data.hero.alt, fallback: data.hero.fallback });
                }}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
              >
                <Edit2 className="w-4 h-4" /> แก้ไข
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Fights Background Section */}
      {activeSection === 'upcoming' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">Upcoming Fights Background</h3>
          {editingId === 'upcoming' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Path หรือ Base64</label>
                <input
                  type="text"
                  value={editForm.image || (data.upcomingFightsBackground?.image || '')}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/upcoming-fights-bg.webp"
                />
                <p className="text-xs text-gray-400 mt-1">หรืออัพโหลดไฟล์ภาพด้านล่าง</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">อัพโหลดภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
                        setEditForm({ ...editForm, image: compressedBase64 });
                      } catch (error) {
                        console.error('Error compressing image:', error);
                        showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                      }
                    }
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                />
              </div>
              {editForm.image && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <img
                    src={editForm.image}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fallback Image Path (ถ้าภาพหลักโหลดไม่ได้)</label>
                <input
                  type="text"
                  value={editForm.fallback || (data.upcomingFightsBackground?.fallback || '/images/hero/World class fighters.webp')}
                  onChange={(e) => setEditForm({ ...editForm, fallback: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/World class fighters.webp"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpcomingBackgroundSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <img
                  src={data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.webp'}
                  alt="Upcoming Fights Background"
                  className="max-w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = data.upcomingFightsBackground?.fallback || '/images/hero/World class fighters.webp';
                  }}
                />
                <p className="text-gray-300"><strong>Path:</strong> {data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.webp'}</p>
                <p className="text-gray-300"><strong>Fallback:</strong> {data.upcomingFightsBackground?.fallback || '/images/hero/World class fighters.webp'}</p>
              </div>
              <button
                onClick={() => {
                  setEditingId('upcoming');
                  setEditForm({ 
                    image: data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.webp',
                    fallback: data.upcomingFightsBackground?.fallback || '/images/hero/World class fighters.webp'
                  });
                }}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
              >
                <Edit2 className="w-4 h-4" /> แก้ไข
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Background Section */}
      {activeSection === 'booking' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">จัดการพื้นหลัง booking</h3>
          {editingId === 'booking' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Path หรือ Base64</label>
                <input
                  type="text"
                  value={editForm.image || (data.bookingBackground?.image || '')}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/World class fighters.webp"
                />
                <p className="text-xs text-gray-400 mt-1">หรืออัพโหลดไฟล์ภาพด้านล่าง (จะถูกแปลงเป็น WebP อัตโนมัติ)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">อัพโหลดภาพ</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        // Validate image
                        const validation = validateImage(file, 10);
                        if (!validation.valid) {
                          showMessage('error', validation.error);
                          return;
                        }
                        
                        // Compress and convert to WebP
                        const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
                        setEditForm({ ...editForm, image: compressedBase64 });
                        showMessage('success', 'อัพโหลดภาพสำเร็จ (จะถูกแปลงเป็น WebP อัตโนมัติ)');
                      } catch (error) {
                        console.error('Error compressing image:', error);
                        showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                      }
                    }
                  }}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                />
              </div>
              {editForm.image && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <img
                    src={editForm.image}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fallback Image Path (ถ้าภาพหลักโหลดไม่ได้)</label>
                <input
                  type="text"
                  value={editForm.fallback || (data.bookingBackground?.fallback || '/images/hero/World class fighters.webp')}
                  onChange={(e) => setEditForm({ ...editForm, fallback: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/World class fighters.webp"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBookingBackgroundSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <img
                  src={data.bookingBackground?.image || '/images/hero/World class fighters.webp'}
                  alt="Booking Background"
                  className="max-w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = data.bookingBackground?.fallback || '/images/hero/World class fighters.webp';
                  }}
                />
                <p className="text-gray-300"><strong>Path:</strong> {data.bookingBackground?.image || '/images/hero/World class fighters.webp'}</p>
                <p className="text-gray-300"><strong>Fallback:</strong> {data.bookingBackground?.fallback || '/images/hero/World class fighters.webp'}</p>
              </div>
              <button
                onClick={() => {
                  setEditingId('booking');
                  setEditForm({ 
                    image: data.bookingBackground?.image || '/images/hero/World class fighters.webp',
                    fallback: data.bookingBackground?.fallback || '/images/hero/World class fighters.webp'
                  });
                }}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
              >
                <Edit2 className="w-4 h-4" /> แก้ไข
              </button>
            </div>
          )}
        </div>
      )}

      {/* Highlights Section */}
      {activeSection === 'highlights' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-black text-white uppercase">Highlights</h3>
              <p className="text-sm text-gray-400 mt-1">
                {data.highlights.length} / 9 highlights
              </p>
            </div>
            <button
              onClick={() => {
                if (data.highlights.length >= 9) {
                  showMessage('error', 'ไม่สามารถเพิ่ม Highlight ได้เกิน 9 รายการ');
                  return;
                }
                setEditingId('new');
                setEditForm({
                  title: { th: '', en: '' },
                  date: { th: '', en: '' },
                  description: { th: '', en: '' },
                  image: ''
                });
              }}
              disabled={data.highlights.length >= 9}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                data.highlights.length >= 9
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-500'
              }`}
            >
              <Plus className="w-4 h-4" /> เพิ่ม Highlight
            </button>
          </div>

          {/* Add New Highlight Form - Show separately above the grid */}
          {editingId === 'new' && (
            <div className="bg-gray-900 rounded-lg p-6 border-2 border-green-500 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">เพิ่ม Highlight ใหม่</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title (TH)</label>
                  <input
                    type="text"
                    placeholder="Title (TH)"
                    value={editForm.title?.th || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: { ...editForm.title, th: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title (EN)</label>
                  <input
                    type="text"
                    placeholder="Title (EN)"
                    value={editForm.title?.en || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: { ...editForm.title, en: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date (TH)</label>
                  <input
                    type="text"
                    placeholder="Date (TH)"
                    value={editForm.date?.th || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: { ...editForm.date, th: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date (EN)</label>
                  <input
                    type="text"
                    placeholder="Date (EN)"
                    value={editForm.date?.en || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: { ...editForm.date, en: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (TH)</label>
                  <textarea
                    placeholder="Description (TH)"
                    value={editForm.description?.th || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: { ...editForm.description, th: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (EN)</label>
                  <textarea
                    placeholder="Description (EN)"
                    value={editForm.description?.en || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: { ...editForm.description, en: e.target.value } })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">รูปภาพ: URL จากเว็บอื่น / Path / Base64</label>
                  <input
                    type="text"
                    placeholder="https://... หรือ /images/... หรือ Base64 (รองรับรูปจากเว็บอื่น)"
                    value={editForm.image || ''}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mb-2"
                  />
                  <p className="text-xs text-gray-400 mb-2">หรืออัพโหลดไฟล์ภาพด้านล่าง</p>
                  <div className="flex gap-2 mb-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const validation = validateImage(file, 10);
                              if (!validation.valid) {
                                showMessage('error', validation.error);
                                return;
                              }
                              const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
                              setEditForm({ ...editForm, image: compressedBase64 });
                              showMessage('success', 'อัพโหลดภาพสำเร็จ (จะถูกแปลงเป็น WebP อัตโนมัติ)');
                            } catch (error) {
                              console.error('Error compressing image:', error);
                              showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                            }
                          }
                          // Reset file input
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors text-sm font-semibold">
                        <Upload className="w-4 h-4" /> อัพโหลดภาพใหม่
                      </div>
                    </label>
                    {editForm.image && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้?')) {
                            setEditForm({ ...editForm, image: '' });
                            showMessage('success', 'ลบภาพสำเร็จ');
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500 transition-colors text-sm font-semibold"
                      >
                        <XCircle className="w-4 h-4" /> ลบภาพ
                      </button>
                    )}
                  </div>
                </div>
                {editForm.image && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
                    <div className="bg-gray-800 rounded-lg p-4 relative">
                      <img
                        src={editForm.image}
                        alt="Preview"
                        className="max-w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleHighlightSave(null)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-500"
                >
                  <Save className="w-4 h-4" /> เพิ่ม Highlight
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                >
                  <X className="w-4 h-4" /> ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Existing Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {data.highlights.map((highlight) => (
              <div key={highlight.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                {editingId === highlight.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Title (TH)"
                      value={editForm.title?.th || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: { ...editForm.title, th: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Title (EN)"
                      value={editForm.title?.en || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: { ...editForm.title, en: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Date (TH)"
                      value={editForm.date?.th || ''}
                      onChange={(e) => setEditForm({ ...editForm, date: { ...editForm.date, th: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Date (EN)"
                      value={editForm.date?.en || ''}
                      onChange={(e) => setEditForm({ ...editForm, date: { ...editForm.date, en: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <textarea
                      placeholder="Description (TH)"
                      value={editForm.description?.th || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: { ...editForm.description, th: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                      rows="2"
                    />
                    <textarea
                      placeholder="Description (EN)"
                      value={editForm.description?.en || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: { ...editForm.description, en: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                      rows="2"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">รูปภาพ: URL จากเว็บอื่น / Path / Base64</label>
                      <input
                        type="text"
                        placeholder="https://... หรือ /images/... หรือ Base64 (รองรับรูปจากเว็บอื่น)"
                        value={editForm.image || ''}
                        onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mb-2"
                      />
                      <div className="flex gap-2 mb-2">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                try {
                                  const validation = validateImage(file, 10);
                                  if (!validation.valid) {
                                    showMessage('error', validation.error);
                                    return;
                                  }
                                  const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
                                  setEditForm({ ...editForm, image: compressedBase64 });
                                  showMessage('success', 'อัพโหลดภาพสำเร็จ (จะถูกแปลงเป็น WebP อัตโนมัติ)');
                                } catch (error) {
                                  console.error('Error compressing image:', error);
                                  showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                                }
                              }
                              // Reset file input
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                          <div className="bg-yellow-500 text-black px-3 py-2 rounded flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors text-sm font-semibold">
                            <Upload className="w-3 h-3" /> อัพโหลดภาพใหม่
                          </div>
                        </label>
                        {editForm.image && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้?')) {
                                setEditForm({ ...editForm, image: '' });
                                showMessage('success', 'ลบภาพสำเร็จ');
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-red-500 transition-colors text-sm font-semibold"
                          >
                            <XCircle className="w-3 h-3" /> ลบภาพ
                          </button>
                        )}
                      </div>
                      {editForm.image && (
                        <div className="bg-gray-800 rounded-lg p-3 mt-2">
                          <img
                            src={editForm.image}
                            alt="Preview"
                            className="max-w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleHighlightSave(highlight.id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={highlight.image}
                      alt={highlight.title?.en || highlight.title?.th}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <h4 className="text-white font-semibold mb-1">{highlight.title?.en || highlight.title?.th}</h4>
                    <p className="text-gray-400 text-sm mb-3">{highlight.date?.en || highlight.date?.th}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setEditingId(highlight.id);
                          setEditForm({ ...highlight });
                        }}
                        className="flex-1 bg-yellow-500 text-black px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleHighlightDelete(highlight.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stadium Highlights Section - จัดการ highlight สนาม (ภาพอย่างเดียว ไม่จำกัด) */}
      {activeSection === 'stadium-highlights' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">จัดการ highlight สนาม</h3>
          <p className="text-gray-400 mb-6 text-sm">
            เลือกสนามและอัพโหลดภาพ fight highlights (แสดงเฉพาะภาพ ไม่มีคำบรรยาย) ไม่จำกัดจำนวน - แสดงก่อน Upcoming Fights ในหน้าสนาม
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">เลือกสนาม</label>
            <select
              value={selectedStadiumId || ''}
              onChange={(e) => setSelectedStadiumId(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">-- เลือกสนาม --</option>
              {data?.stadiums?.map((stadium) => (
                <option key={stadium.id} value={stadium.id}>
                  {typeof stadium.name === 'object' ? (stadium.name?.th || stadium.name?.en || '') : (stadium.name || '')}
                </option>
              ))}
            </select>
          </div>

          {selectedStadiumId && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 text-sm">
                  ลำดับการโชว์: 1 = แรก, 2 = ถัดไป, ... ใช้ปุ่ม ↑ ↓ เพื่อเปลี่ยนลำดับ
                </p>
                <button
                  onClick={async () => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const validation = validateImage(file, 10);
                        if (!validation.valid) {
                          showMessage('error', validation.error);
                          return;
                        }
                        const compressedBase64 = await compressImageToExactSize(file, 1500, 405, 0.85);
                        const items = stadiumHighlightImagesMap[selectedStadiumId] || [];
                        const result = await createStadiumHighlightImage(selectedStadiumId, compressedBase64, items.length);
                        if (result) {
                          showMessage('success', 'เพิ่มภาพสำเร็จ');
                          await loadStadiumHighlightImages();
                        } else {
                          showMessage('error', 'เกิดข้อผิดพลาด');
                        }
                      } catch (err) {
                        console.error(err);
                        showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลด');
                      }
                    };
                    fileInput.click();
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
                >
                  <Plus className="w-5 h-5" /> เพิ่มภาพ
                </button>
              </div>

              <div className="space-y-3">
                {(stadiumHighlightImagesMap[selectedStadiumId] || []).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <span className="text-yellow-500 font-bold w-8 text-center">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <img
                        src={item.image}
                        alt=""
                        className="h-20 w-32 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (index === 0) return;
                          const items = [...(stadiumHighlightImagesMap[selectedStadiumId] || [])];
                          [items[index - 1], items[index]] = [items[index], items[index - 1]];
                          const result = await reorderStadiumHighlightImages(selectedStadiumId, items.map(i => i.id));
                          if (result) {
                            showMessage('success', 'เปลี่ยนลำดับสำเร็จ');
                            setStadiumHighlightImagesMap(prev => ({ ...prev, [selectedStadiumId]: result }));
                          }
                        }}
                        disabled={index === 0}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="เลื่อนขึ้น"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const items = stadiumHighlightImagesMap[selectedStadiumId] || [];
                          if (index >= items.length - 1) return;
                          const newItems = [...items];
                          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                          const result = await reorderStadiumHighlightImages(selectedStadiumId, newItems.map(i => i.id));
                          if (result) {
                            showMessage('success', 'เปลี่ยนลำดับสำเร็จ');
                            setStadiumHighlightImagesMap(prev => ({ ...prev, [selectedStadiumId]: result }));
                          }
                        }}
                        disabled={index >= (stadiumHighlightImagesMap[selectedStadiumId] || []).length - 1}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="เลื่อนลง"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <label className="cursor-pointer p-2 bg-blue-600 hover:bg-blue-500 rounded" title="เปลี่ยนภาพ">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const validation = validateImage(file, 10);
                              if (!validation.valid) {
                                showMessage('error', validation.error);
                                return;
                              }
                              const compressedBase64 = await compressImageToExactSize(file, 1500, 405, 0.85);
                              const result = await updateStadiumHighlightImage(item.id, compressedBase64);
                              if (result) {
                                showMessage('success', 'อัพเดทภาพสำเร็จ');
                                await loadStadiumHighlightImages();
                              }
                            } catch (err) {
                              showMessage('error', 'เกิดข้อผิดพลาด');
                            }
                            e.target.value = '';
                          }}
                        />
                        <Upload className="w-4 h-4 text-white" />
                      </label>
                      <button
                        onClick={async () => {
                          if (!window.confirm('ลบภาพนี้?')) return;
                          const ok = await deleteStadiumHighlightImage(item.id);
                          if (ok) {
                            showMessage('success', 'ลบภาพสำเร็จ');
                            await loadStadiumHighlightImages();
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(stadiumHighlightImagesMap[selectedStadiumId] || []).length === 0 && (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-600 rounded-lg">
                  <p className="mb-4">ยังไม่มีภาพสำหรับสนามนี้</p>
                  <button
                    onClick={async () => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const validation = validateImage(file, 10);
                          if (!validation.valid) {
                            showMessage('error', validation.error);
                            return;
                          }
                          const compressedBase64 = await compressImageToExactSize(file, 1500, 405, 0.85);
                          const result = await createStadiumHighlightImage(selectedStadiumId, compressedBase64, 0);
                          if (result) {
                            showMessage('success', 'เพิ่มภาพสำเร็จ');
                            await loadStadiumHighlightImages();
                          }
                        } catch (err) {
                          showMessage('error', 'เกิดข้อผิดพลาด');
                        }
                      };
                      fileInput.click();
                    }}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg flex items-center gap-2 font-semibold mx-auto"
                  >
                    <Plus className="w-5 h-5" /> เพิ่มภาพแรก
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* คำบรรยาย Section - Stadium Descriptions */}
      {activeSection === 'stadium-descriptions' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">คำบรรยายสนาม</h3>
          <p className="text-gray-400 mb-6 text-sm">
            แก้ไขข้อความและรูปแบบตัวอักษรของส่วนคำบรรยายที่แสดงหลัง calendar ในหน้าสนาม (เช่น Rajadamnern)
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">เลือกสนาม</label>
            <select
              value={descStadiumId || ''}
              onChange={(e) => {
                const id = e.target.value;
                setDescStadiumId(id);
                setDescEditForm(null);
                const existing = stadiumDescriptionsMap[id];
                if (existing) {
                  setDescEditForm({
                    h1: existing.h1 || '',
                    h2: existing.h2 || '',
                    h3: existing.h3 || '',
                    paragraphs: Array.isArray(existing.paragraphs) ? [...existing.paragraphs] : [],
                    fontSize: existing.fontSize || '16px',
                    fontFamily: existing.fontFamily || 'inherit',
                    fontColor: existing.fontColor || '#d1d5db',
                    backgroundColor: existing.backgroundColor || '#111827',
                    images: Array.isArray(existing.images) ? [...existing.images] : []
                  });
                } else {
                  setDescEditForm({
                    h1: '',
                    h2: '',
                    h3: '',
                    paragraphs: [''],
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    fontColor: '#d1d5db',
                    backgroundColor: '#111827',
                    images: []
                  });
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">-- เลือกสนาม --</option>
              {data?.stadiums?.map((stadium) => (
                <option key={stadium.id} value={stadium.id}>
                  {typeof stadium.name === 'object' ? (stadium.name?.th || stadium.name?.en || '') : (stadium.name || '')}
                </option>
              ))}
            </select>
          </div>

          {descStadiumId && (() => {
            const existing = stadiumDescriptionsMap[descStadiumId];
            const form = descEditForm ?? (existing ? {
              h1: existing.h1 || '',
              h2: existing.h2 || '',
              h3: existing.h3 || '',
              paragraphs: Array.isArray(existing.paragraphs) && existing.paragraphs.length > 0 ? [...existing.paragraphs] : [''],
              fontSize: existing.fontSize || '16px',
              fontFamily: existing.fontFamily || 'inherit',
              fontColor: existing.fontColor || '#d1d5db',
              backgroundColor: existing.backgroundColor || '#111827',
              images: Array.isArray(existing.images) ? [...existing.images] : []
            } : {
              h1: '',
              h2: '',
              h3: '',
              paragraphs: [''],
              fontSize: '16px',
              fontFamily: 'inherit',
              fontColor: '#d1d5db',
              backgroundColor: '#111827',
              images: []
            });
            const setForm = (updates) => setDescEditForm(prev => ({ ...prev, ...updates }));

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">H1 (หัวข้อหลัก)</label>
                    <input
                      type="text"
                      value={form.h1 || ''}
                      onChange={(e) => setForm({ h1: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="IMMERSE IN MUAY THAI LIKE NEVER BEFORE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">H2</label>
                    <input
                      type="text"
                      value={form.h2 || ''}
                      onChange={(e) => setForm({ h2: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="AT THE WORLD'S FIRST"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">H3</label>
                    <input
                      type="text"
                      value={form.h3 || ''}
                      onChange={(e) => setForm({ h3: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="MUAY THAI STADIUM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ย่อหน้า (กด + เพื่อเพิ่ม)</label>
                  {(form.paragraphs || ['']).map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <textarea
                        value={p}
                        onChange={(e) => {
                          const arr = [...(form.paragraphs || [''])];
                          arr[i] = e.target.value;
                          setForm({ paragraphs: arr });
                        }}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white min-h-[80px]"
                        placeholder={`ย่อหน้า ${i + 1}`}
                        rows={3}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = (form.paragraphs || ['']).filter((_, idx) => idx !== i);
                          if (arr.length === 0) arr.push('');
                          setForm({ paragraphs: arr });
                        }}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded h-fit"
                        title="ลบย่อหน้า"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ paragraphs: [...(form.paragraphs || ['']), ''] })}
                    className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" /> เพิ่มย่อหน้า
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ขนาดตัวอักษร</label>
                    <input
                      type="text"
                      value={form.fontSize || '16px'}
                      onChange={(e) => setForm({ fontSize: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="16px, 1rem, 1.2em"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">รูปแบบอักษร</label>
                    <select
                      value={form.fontFamily || 'inherit'}
                      onChange={(e) => setForm({ fontFamily: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="inherit">inherit (ตามระบบ)</option>
                      <option value="K2D, sans-serif">K2D</option>
                      <option value="sans-serif">sans-serif</option>
                      <option value="serif">serif</option>
                      <option value="monospace">monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">สีตัวอักษร</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(form.fontColor || '') ? form.fontColor : '#d1d5db'}
                        onChange={(e) => setForm({ fontColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-600 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.fontColor || '#d1d5db'}
                        onChange={(e) => setForm({ fontColor: e.target.value })}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="#d1d5db"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">สีพื้นหลัง</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(form.backgroundColor || '') ? form.backgroundColor : '#111827'}
                        onChange={(e) => setForm({ backgroundColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-600 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.backgroundColor || '#111827'}
                        onChange={(e) => setForm({ backgroundColor: e.target.value })}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="#111827"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ภาพประกอบ (อัพโหลดได้หลายภาพ)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.images || []).map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt="" className="w-24 h-24 object-cover rounded border border-gray-600" onError={(e) => e.target.style.display = 'none'} />
                        <button
                          type="button"
                          onClick={() => setForm({ images: (form.images || []).filter((_, idx) => idx !== i) })}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold cursor-pointer hover:bg-yellow-400">
                    <Upload className="w-4 h-4" /> เพิ่มภาพ
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const validation = validateImage(file, 10);
                          if (!validation.valid) {
                            showMessage('error', validation.error);
                            return;
                          }
                          const compressedBase64 = await compressImage(file, 1200, 800, 0.85);
                          setForm({ images: [...(form.images || []), compressedBase64] });
                          showMessage('success', 'เพิ่มภาพสำเร็จ');
                        } catch (err) {
                          showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลด');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={async () => {
                      try {
                        const payload = {
                          h1: form.h1,
                          h2: form.h2,
                          h3: form.h3,
                          paragraphs: (form.paragraphs || ['']).filter(p => p.trim()),
                          fontSize: form.fontSize || '16px',
                          fontFamily: form.fontFamily || 'inherit',
                          fontColor: form.fontColor || '#d1d5db',
                          backgroundColor: form.backgroundColor || '#111827',
                          images: form.images || []
                        };
                        const result = await updateStadiumDescription(descStadiumId, payload);
                        if (result) {
                          showMessage('success', 'บันทึกคำบรรยายสำเร็จ');
                          setStadiumDescriptionsMap(prev => ({ ...prev, [descStadiumId]: result }));
                        } else {
                          showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
                        }
                      } catch (err) {
                        showMessage('error', err.message || 'เกิดข้อผิดพลาด');
                      }
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-semibold hover:bg-green-500"
                  >
                    <Save className="w-5 h-5" /> บันทึก
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Stadium Logos Section */}
      {activeSection === 'logos' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">Stadium Logos</h3>
          <p className="text-gray-400 mb-6 text-sm">
            อัพโหลดโลโก้สำหรับแต่ละสนามมวย (ไฟล์จะถูกแปลงเป็น base64 และเก็บไว้ในระบบ)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {data.stadiums.map((stadium) => {
              const logoPath = `/images/stadium-logos/${stadium.id}-logo.webp`;
              const logoBase64 = stadium.logoBase64 || null;
              const logoPreview = logoBase64 || logoPath;
              const editingLogoId = editingId === `logo-${stadium.id}`;
              
              return (
                <div key={stadium.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  {editingLogoId ? (
                    <div className="space-y-3">
                      <div className="bg-gray-800 rounded-lg p-4 mb-3 flex items-center justify-center h-32 border-2 border-dashed border-gray-600">
                        {editForm.logoPreview ? (
                          <img
                            src={editForm.logoPreview}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <p className="text-gray-500 text-xs text-center">ยังไม่มีโลโก้</p>
                        )}
                      </div>
                      <label className="block">
                        <span className="text-xs text-gray-400 mb-1 block">เลือกไฟล์โลโก้</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                // For stadium logos, use optimized dimensions (logos display at max 300px, so 500px is sufficient with 2x for retina)
                                // Quality 0.85 matches backend processing for consistency
                                const compressedBase64 = await compressImage(file, 500, 500, 0.85);
                                setEditForm({
                                  ...editForm,
                                  logoBase64: compressedBase64,
                                  logoPreview: compressedBase64
                                });
                              } catch (error) {
                                console.error('Error compressing logo:', error);
                                showMessage('error', 'เกิดข้อผิดพลาดในการอัพโหลดโลโก้');
                              }
                            }
                          }}
                          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer"
                        />
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={async () => {
                            if (!editForm.logoBase64) {
                              showMessage('error', 'กรุณาเลือกไฟล์โลโก้');
                              return;
                            }
                            try {
                              const result = await updateStadium(stadium.id, { logoBase64: editForm.logoBase64 });
                              if (result) {
                                showMessage('success', 'อัพเดทโลโก้สำเร็จ');
                                setEditingId(null);
                                setEditForm({});
                                await loadData();
                              } else {
                                showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
                              }
                            } catch (error) {
                              console.error('Error updating logo:', error);
                              showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
                            }
                          }}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({});
                          }}
                          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-800 rounded-lg p-4 mb-3 flex items-center justify-center h-32">
                        <img
                          src={logoPreview}
                          alt={`${stadium.name?.en || stadium.name?.th} logo`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <div className="text-white text-sm font-bold uppercase hidden">
                          {stadium.name?.en || stadium.name?.th}
                        </div>
                      </div>
                      <h4 className="text-white font-semibold mb-2 text-center">{stadium.name?.en || stadium.name?.th}</h4>
                      <div className="bg-gray-800 rounded px-3 py-2 mb-3">
                        <p className="text-xs text-gray-400 mb-1">
                          {logoBase64 ? 'Logo: Base64 (อัพโหลดแล้ว)' : 'Logo Path:'}
                        </p>
                        {!logoBase64 && (
                          <p className="text-xs text-yellow-500 font-mono break-all">{logoPath}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(`logo-${stadium.id}`);
                          setEditForm({
                            logoBase64: stadium.logoBase64 || null,
                            logoPreview: stadium.logoBase64 || logoPath
                          });
                        }}
                        className="w-full bg-yellow-500 text-black px-3 py-2 rounded text-sm font-semibold hover:bg-yellow-400 transition-colors"
                      >
                        {logoBase64 ? 'เปลี่ยนโลโก้' : 'อัพโหลดโลโก้'}
                      </button>
                      {logoBase64 && (
                        <button
                          onClick={async () => {
                            if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโลโก้?')) {
                              try {
                                const result = await updateStadium(stadium.id, { logoBase64: null });
                                if (result) {
                                  showMessage('success', 'ลบโลโก้สำเร็จ');
                                  await loadData();
                                }
                              } catch (error) {
                                console.error('Error deleting logo:', error);
                                showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
                              }
                            }
                          }}
                          className="w-full mt-2 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-500 transition-colors"
                        >
                          ลบโลโก้
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Videos Management Section */}
      {activeSection === 'videos' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">จัดการวิดีโอ</h2>
            <p className="text-gray-400 mb-4">
              จัดการวิดีโอที่จะแสดงในหน้า booking (Select Date และ Select Ticket & Payment) - วิดีโอจะแยกตามสนาม
            </p>
            
            {/* Stadium Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                เลือกสนาม *
              </label>
              <select
                value={selectedStadiumId || ''}
                onChange={(e) => {
                  setSelectedStadiumId(e.target.value);
                  setEditingId(null);
                  setEditForm({});
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">-- เลือกสนาม --</option>
                {stadiums.map((stadium) => (
                  <option key={stadium.id} value={stadium.id}>
                    {stadium.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStadiumId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditForm({ video_url: '', title: '', display_order: 0, is_active: 1 });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                เพิ่มวิดีโอ
              </button>
            )}
          </div>

          {/* Add New Video Form */}
          {selectedStadiumId && editingId === null && Object.keys(editForm).length > 0 && (
            <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">เพิ่มวิดีโอใหม่</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video URL * (YouTube, Vimeo หรือ direct video URL)
                  </label>
                  <input
                    type="text"
                    value={editForm.video_url || ''}
                    onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://example.com/video.mp4"
                  />
                  {editForm.video_url && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Preview:</p>
                      {getEmbedUrl(editForm.video_url).includes('youtube.com/embed') || getEmbedUrl(editForm.video_url).includes('player.vimeo.com') ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={`${getEmbedUrl(editForm.video_url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${editForm.video_url.includes('youtube.com') ? editForm.video_url.match(/[?&]v=([^&]+)/)?.[1] || '' : ''}`}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            allow="autoplay"
                            allowFullScreen
                            title="Video preview"
                          />
                        </div>
                      ) : (
                        <video
                          src={editForm.video_url}
                          className="w-full max-w-md rounded-lg"
                          controls
                          style={{ maxHeight: '300px' }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={editForm.display_order || 0}
                      onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editForm.is_active !== undefined ? editForm.is_active : 1}
                      onChange={(e) => setEditForm({ ...editForm, is_active: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleVideoSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-500 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video List */}
          {selectedStadiumId && (
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                >
                  {editingId === video.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Video URL * (YouTube, Vimeo หรือ direct video URL)
                      </label>
                      <input
                        type="text"
                        value={editForm.video_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="https://www.youtube.com/watch?v=... หรือ https://example.com/video.mp4"
                      />
                      {editForm.video_url && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Preview:</p>
                          {getEmbedUrl(editForm.video_url).includes('youtube.com/embed') || getEmbedUrl(editForm.video_url).includes('player.vimeo.com') ? (
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                src={`${getEmbedUrl(editForm.video_url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${editForm.video_url.includes('youtube.com') ? editForm.video_url.match(/[?&]v=([^&]+)/)?.[1] || '' : ''}`}
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                allow="autoplay"
                                allowFullScreen
                                title="Video preview"
                              />
                            </div>
                          ) : (
                            <video
                              src={editForm.video_url}
                              className="w-full max-w-md rounded-lg"
                              controls
                              style={{ maxHeight: '300px' }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={editForm.display_order || 0}
                          onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={editForm.is_active !== undefined ? editForm.is_active : 1}
                          onChange={(e) => setEditForm({ ...editForm, is_active: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleVideoSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-500 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        บันทึก
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded hover:bg-gray-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Video className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-white">
                          Video #{video.id}
                        </h3>
                        {video.is_active === 0 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mb-2">Display Order: {video.display_order}</p>
                      <p className="text-gray-400 text-sm mb-2 break-all">{video.video_url}</p>
                      {(() => {
                        const embedUrl = getEmbedUrl(video.video_url);
                        const isYouTube = embedUrl.includes('youtube.com/embed');
                        const isVimeo = embedUrl.includes('player.vimeo.com');
                        
                        if (isYouTube || isVimeo) {
                          return (
                            <div className="relative w-full max-w-md" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                src={embedUrl}
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                allow="autoplay"
                                allowFullScreen
                                title={`Video ${video.id}`}
                              />
                            </div>
                          );
                        } else {
                          return (
                            <video
                              src={video.video_url}
                              className="w-full max-w-md rounded-lg"
                              controls
                              style={{ maxHeight: '200px' }}
                            />
                          );
                        }
                      })()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(video.id);
                          setEditForm({
                            video_url: video.video_url,
                            display_order: video.display_order,
                            is_active: video.is_active
                          });
                        }}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleVideoDelete(video.id)}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {videos.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีวิดีโอสำหรับสนามนี้</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ImagesManagement;

