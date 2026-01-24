import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { getAllData, addStadium, updateStadium, deleteStadium } from '../db/imagesDb';
import { compressImage } from '../utils/imageHelpers';

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

const StadiumsManagement = () => {
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

      {/* Stadiums Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-lg md:text-xl font-black text-white uppercase">Stadiums</h3>
          <button
            onClick={() => {
              setEditingId('new-stadium');
              setEditForm({
                name: { th: '', en: '' },
                location: { th: '', en: '' },
                image: '',
                province: 'bangkok',
                scheduleDays: []
              });
            }}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> เพิ่มสนาม
          </button>
        </div>
        
        {/* Add New Stadium Form */}
        {editingId === 'new-stadium' && (
          <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-gray-700">
            <h4 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">เพิ่มสนามใหม่</h4>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อสนาม (TH)</label>
                <input
                  type="text"
                  value={editForm.name?.th || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: { ...editForm.name, th: e.target.value } })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  placeholder="เช่น สนามมวยราชดำเนิน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อสนาม (EN)</label>
                <input
                  type="text"
                  value={editForm.name?.en || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: { ...editForm.name, en: e.target.value } })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  placeholder="เช่น Rajadamnern Stadium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">จังหวัด</label>
                <select
                  value={editForm.province || 'bangkok'}
                  onChange={(e) => {
                    const province = e.target.value;
                    setEditForm({
                      ...editForm,
                      province,
                      location: {
                        th: province === 'bangkok' ? 'กรุงเทพ' : 'ภูเก็ต',
                        en: province === 'bangkok' ? 'Bangkok' : 'Phuket'
                      }
                    });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="bangkok">กรุงเทพ (Bangkok)</option>
                  <option value="phuket">ภูเก็ต (Phuket)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">วันชก</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                    const isChecked = editForm.scheduleDays?.includes(day) || false;
                    return (
                      <label
                        key={day}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-yellow-500 text-black font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentDays = editForm.scheduleDays || [];
                            if (e.target.checked) {
                              setEditForm({ ...editForm, scheduleDays: [...currentDays, day] });
                            } else {
                              setEditForm({ ...editForm, scheduleDays: currentDays.filter(d => d !== day) });
                            }
                          }}
                          className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                        />
                        <span>วัน{dayNames[day]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ภาพสนาม (ไม่บังคับ)</label>
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
                <p className="text-xs text-gray-400 mt-1">หรือกรอก path ของภาพ เช่น /images/stadiums/stadium.jpg</p>
                <input
                  type="text"
                  value={editForm.image || ''}
                  onChange={(e) => {
                    // Only set if it's not a base64 string
                    if (!e.target.value.startsWith('data:image')) {
                      setEditForm({ ...editForm, image: e.target.value });
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm mt-2"
                  placeholder="/images/stadiums/stadium.jpg"
                />
              </div>
              {editForm.image && (
                <div className="bg-gray-800 rounded-lg p-4">
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
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={async () => {
                    if (!editForm.name?.th || !editForm.name?.en) {
                      showMessage('error', 'กรุณากรอกชื่อสนามทั้งภาษาไทยและอังกฤษ');
                      return;
                    }
                    
                    try {
                      // Generate ID from English name (lowercase, replace spaces with hyphens)
                      const id = editForm.name.en
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      
                      const scheduleDays = editForm.scheduleDays || [];
                      const scheduleText = generateScheduleText(scheduleDays);
                      
                      const stadiumData = {
                        id,
                        name: editForm.name,
                        location: editForm.location || {
                          th: editForm.province === 'bangkok' ? 'กรุงเทพ' : 'ภูเก็ต',
                          en: editForm.province === 'bangkok' ? 'Bangkok' : 'Phuket'
                        },
                        image: editForm.image || '',
                        schedule: scheduleText,
                        scheduleDays: scheduleDays
                      };
                      
                      const result = await addStadium(stadiumData);
                      if (result) {
                        showMessage('success', 'เพิ่มสนามสำเร็จ');
                        setEditingId(null);
                        setEditForm({});
                        await loadData();
                      } else {
                        showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่มสนาม');
                      }
                    } catch (error) {
                      console.error('Error adding stadium:', error);
                      showMessage('error', 'เกิดข้อผิดพลาดในการเพิ่มสนาม');
                    }
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-500"
                >
                  เพิ่มสนาม
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm({});
                  }}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">จังหวัด</label>
                    <select
                      value={editForm.province || (editForm.location?.th === 'กรุงเทพ' || editForm.location?.en === 'Bangkok' ? 'bangkok' : 'phuket')}
                      onChange={(e) => {
                        const province = e.target.value;
                        setEditForm({
                          ...editForm,
                          province,
                          location: {
                            th: province === 'bangkok' ? 'กรุงเทพ' : 'ภูเก็ต',
                            en: province === 'bangkok' ? 'Bangkok' : 'Phuket'
                          }
                        });
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="bangkok">กรุงเทพ (Bangkok)</option>
                      <option value="phuket">ภูเก็ต (Phuket)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">วันชก</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
                        const isChecked = editForm.scheduleDays?.includes(day) || false;
                        return (
                          <label
                            key={day}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-yellow-500 text-black font-semibold'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentDays = editForm.scheduleDays || [];
                                if (e.target.checked) {
                                  setEditForm({ ...editForm, scheduleDays: [...currentDays, day] });
                                } else {
                                  setEditForm({ ...editForm, scheduleDays: currentDays.filter(d => d !== day) });
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
                            />
                            <span>วัน{dayNames[day]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ภาพสนาม</label>
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
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 cursor-pointer mb-2"
                    />
                    <p className="text-xs text-gray-400 mb-2">หรือกรอก path ของภาพ เช่น /images/stadiums/stadium.jpg</p>
                    <input
                      type="text"
                      placeholder="Image Path"
                      value={editForm.image || ''}
                      onChange={(e) => {
                        // Only set if it's not a base64 string
                        if (!e.target.value.startsWith('data:image')) {
                          setEditForm({ ...editForm, image: e.target.value });
                        }
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                    {editForm.image && (
                      <div className="bg-gray-800 rounded-lg p-4 mt-2">
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
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const scheduleDays = editForm.scheduleDays || [];
                          const scheduleText = generateScheduleText(scheduleDays);
                          
                          const updateData = {
                            ...editForm,
                            location: editForm.location || {
                              th: editForm.province === 'bangkok' ? 'กรุงเทพ' : 'ภูเก็ต',
                              en: editForm.province === 'bangkok' ? 'Bangkok' : 'Phuket'
                            },
                            schedule: scheduleText,
                            scheduleDays: scheduleDays
                          };
                          const result = await updateStadium(stadium.id, updateData);
                          if (result) {
                            showMessage('success', 'อัพเดท Stadium สำเร็จ');
                            setEditingId(null);
                            setEditForm({});
                            await loadData();
                          }
                        } catch (error) {
                          console.error('Error updating stadium:', error);
                          showMessage('error', 'เกิดข้อผิดพลาดในการอัพเดท');
                        }
                      }}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-500"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสนามนี้?')) {
                          try {
                            const result = await deleteStadium(stadium.id);
                            if (result) {
                              showMessage('success', 'ลบสนามสำเร็จ');
                              setEditingId(null);
                              setEditForm({});
                              await loadData();
                            } else {
                              showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
                            }
                          } catch (error) {
                            console.error('Error deleting stadium:', error);
                            showMessage('error', 'เกิดข้อผิดพลาดในการลบ');
                          }
                        }
                      }}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-500"
                    >
                      ลบ
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
                  {stadium.image ? (
                    <img
                      src={stadium.image}
                      alt={stadium.name?.en || stadium.name?.th}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3Eไม่มีภาพ%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">ไม่มีภาพ</p>
                    </div>
                  )}
                  <h4 className="text-white font-semibold mb-1">{stadium.name?.en || stadium.name?.th}</h4>
                  <p className="text-gray-400 text-sm mb-3">{stadium.location?.en || stadium.location?.th}</p>
                  <button
                    onClick={() => {
                      setEditingId(stadium.id);
                      const locationTh = stadium.location?.th || stadium.location || '';
                      const locationEn = stadium.location?.en || stadium.location || '';
                      const province = locationTh.includes('กรุงเทพ') || locationEn.toLowerCase().includes('bangkok') ? 'bangkok' : 'phuket';
                      setEditForm({ 
                        ...stadium,
                        province,
                        scheduleDays: stadium.scheduleDays || []
                      });
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
    </div>
  );
};

export default StadiumsManagement;
