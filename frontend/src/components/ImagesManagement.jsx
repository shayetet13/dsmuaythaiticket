import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import { getAllData, updateHeroImage, updateHighlight, addHighlight, deleteHighlight, updateStadium, updateUpcomingFightsBackground } from '../db/imagesDb';

const ImagesManagement = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [data, setData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allData = await getAllData();
      setData(allData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Compress image to reduce file size (less aggressive now that we use IndexedDB)
  const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const sections = [
    { id: 'hero', label: 'Hero Image' },
    { id: 'upcoming', label: 'Upcoming Fights Background' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'stadiums', label: 'Stadiums' },
    { id: 'logos', label: 'Stadium Logos' }
  ];

  // Hero Image Management
  const handleHeroSave = async () => {
    try {
      const result = await updateHeroImage(editForm.image, editForm.alt || 'Muay Thai');
      if (result) {
        showMessage('success', 'อัพเดท Hero Image สำเร็จ');
        setEditingId(null);
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

  // Highlight Management
  const handleHighlightSave = async (id) => {
    try {
      if (id) {
        // Update existing
        const result = await updateHighlight(id, editForm);
        if (result) {
          showMessage('success', 'อัพเดท Highlight สำเร็จ');
          setEditingId(null);
          await loadData();
        } else {
          showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
        }
      } else {
        // Add new
        const result = await addHighlight(editForm);
        if (result) {
          showMessage('success', 'เพิ่ม Highlight สำเร็จ');
          setEditingId(null);
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
      <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
        <div className="flex flex-wrap gap-2 p-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setEditingId(null);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">Hero Image</h3>
          {editingId === 'hero' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Path</label>
                <input
                  type="text"
                  value={editForm.image || data.hero.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/hero/hero-bg.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Alt Text</label>
                <input
                  type="text"
                  value={editForm.alt || data.hero.alt}
                  onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleHeroSave}
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
                  src={data.hero.image}
                  alt={data.hero.alt}
                  className="max-w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = data.hero.fallback || '/images/highlights/World class fighters.jpg';
                  }}
                />
                <p className="text-gray-300"><strong>Path:</strong> {data.hero.image}</p>
                <p className="text-gray-300"><strong>Alt:</strong> {data.hero.alt}</p>
              </div>
              <button
                onClick={() => {
                  setEditingId('hero');
                  setEditForm({ image: data.hero.image, alt: data.hero.alt });
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
                  placeholder="/images/upcoming-fights-bg.jpg"
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
                  value={editForm.fallback || (data.upcomingFightsBackground?.fallback || '/images/highlights/World class fighters.jpg')}
                  onChange={(e) => setEditForm({ ...editForm, fallback: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="/images/highlights/World class fighters.jpg"
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
                  src={data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.jpg'}
                  alt="Upcoming Fights Background"
                  className="max-w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = data.upcomingFightsBackground?.fallback || '/images/highlights/World class fighters.jpg';
                  }}
                />
                <p className="text-gray-300"><strong>Path:</strong> {data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.jpg'}</p>
                <p className="text-gray-300"><strong>Fallback:</strong> {data.upcomingFightsBackground?.fallback || '/images/highlights/World class fighters.jpg'}</p>
              </div>
              <button
                onClick={() => {
                  setEditingId('upcoming');
                  setEditForm({ 
                    image: data.upcomingFightsBackground?.image || '/images/upcoming-fights-bg.jpg',
                    fallback: data.upcomingFightsBackground?.fallback || '/images/highlights/World class fighters.jpg'
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
            <h3 className="text-xl font-black text-white uppercase">Highlights</h3>
            <button
              onClick={() => {
                setEditingId('new');
                setEditForm({
                  title: { th: '', en: '' },
                  date: { th: '', en: '' },
                  image: ''
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> เพิ่ม Highlight
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <input
                      type="text"
                      placeholder="Image Path"
                      value={editForm.image || ''}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <div className="flex gap-2">
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
                ) : editingId === 'new' ? (
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
                    <input
                      type="text"
                      placeholder="Image Path"
                      value={editForm.image || ''}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleHighlightSave(null)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm"
                      >
                        เพิ่ม
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
                    <div className="flex gap-2">
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

      {/* Stadiums Section */}
      {activeSection === 'stadiums' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">Stadiums</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.stadiums.map((stadium) => (
              <div key={stadium.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                {editingId === stadium.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name (TH)"
                      value={editForm.name?.th || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: { ...editForm.name, th: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Name (EN)"
                      value={editForm.name?.en || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: { ...editForm.name, en: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Image Path"
                      value={editForm.image || ''}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const result = await updateStadium(stadium.id, editForm);
                            if (result) {
                              showMessage('success', 'อัพเดท Stadium สำเร็จ');
                              setEditingId(null);
                              await loadData();
                            }
                          } catch (error) {
                            console.error('Error updating stadium:', error);
                            showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
                          }
                        }}
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
                      src={stadium.image}
                      alt={stadium.name?.en || stadium.name?.th}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <h4 className="text-white font-semibold mb-1">{stadium.name?.en || stadium.name?.th}</h4>
                    <p className="text-gray-400 text-sm mb-3">{stadium.location?.en || stadium.location?.th}</p>
                    <button
                      onClick={() => {
                        setEditingId(stadium.id);
                        setEditForm({ ...stadium });
                      }}
                      className="w-full bg-yellow-500 text-black px-3 py-2 rounded text-sm font-semibold"
                    >
                      แก้ไข
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stadium Logos Section */}
      {activeSection === 'logos' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-black text-white mb-4 uppercase">Stadium Logos</h3>
          <p className="text-gray-400 mb-6 text-sm">
            อัพโหลดโลโก้สำหรับแต่ละสนามมวย (ไฟล์จะถูกแปลงเป็น base64 และเก็บไว้ในระบบ)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.stadiums.map((stadium) => {
              const logoPath = `/images/stadium-logos/${stadium.id}-logo.png`;
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
                                // For stadium logos, use smaller max dimensions but higher quality
                                const compressedBase64 = await compressImage(file, 800, 800, 0.9);
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
                      <div className="flex gap-2">
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

    </div>
  );
};

export default ImagesManagement;

