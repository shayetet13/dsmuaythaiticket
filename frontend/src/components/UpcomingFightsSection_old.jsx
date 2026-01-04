import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Ticket, ChevronRight, Sparkles } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import AnimatedItem from './AnimatedItem';

const UpcomingFightsSection = ({ weeklyFights, language, stadiums, t, onBookClick }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Day configuration with colors and icons
  const dayConfig = {
    monday: {
      label: language === 'th' ? 'จันทร์' : 'MONDAY',
      labelShort: language === 'th' ? 'จ' : 'MON',
      color: 'from-blue-600 to-blue-800',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-600/10',
      textColor: 'text-blue-400',
      icon: '🥊'
    },
    tuesday: {
      label: language === 'th' ? 'อังคาร' : 'TUESDAY',
      labelShort: language === 'th' ? 'อ' : 'TUE',
      color: 'from-purple-600 to-purple-800',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-600/10',
      textColor: 'text-purple-400',
      icon: '💪'
    },
    wednesday: {
      label: language === 'th' ? 'พุธ' : 'WEDNESDAY',
      labelShort: language === 'th' ? 'พ' : 'WED',
      color: 'from-yellow-600 to-yellow-800',
      borderColor: 'border-yellow-500',
      bgColor: 'bg-yellow-600/10',
      textColor: 'text-yellow-400',
      icon: '🔥'
    },
    thursday: {
      label: language === 'th' ? 'พฤหัสบดี' : 'THURSDAY',
      labelShort: language === 'th' ? 'พฤ' : 'THU',
      color: 'from-green-600 to-green-800',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-600/10',
      textColor: 'text-green-400',
      icon: '⚡'
    },
    friday: {
      label: language === 'th' ? 'ศุกร์' : 'FRIDAY',
      labelShort: language === 'th' ? 'ศ' : 'FRI',
      color: 'from-orange-600 to-orange-800',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-600/10',
      textColor: 'text-orange-400',
      icon: '👊'
    },
    saturday: {
      label: language === 'th' ? 'เสาร์' : 'SATURDAY',
      labelShort: language === 'th' ? 'ส' : 'SAT',
      color: 'from-red-600 to-red-800',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-600/10',
      textColor: 'text-red-400',
      icon: '🏆'
    },
    sunday: {
      label: language === 'th' ? 'อาทิตย์' : 'SUNDAY',
      labelShort: language === 'th' ? 'อา' : 'SUN',
      color: 'from-pink-600 to-pink-800',
      borderColor: 'border-pink-500',
      bgColor: 'bg-pink-600/10',
      textColor: 'text-pink-400',
      icon: '⭐'
    }
  };

  // Get stadium logos from weeklyFight
  const getStadiumLogos = (weeklyFight) => {
    if (!weeklyFight || !weeklyFight.logos) return [];
    
    return weeklyFight.logos.slice(0, 3).map(logoPath => {
      // Check if it's a base64 data URI
      if (logoPath && logoPath.startsWith('data:')) {
        return { logoPath, isBase64: true };
      }
      
      // Try to find matching stadium by ID in logo path
      let stadium = null;
      if (logoPath) {
        for (const s of stadiums) {
          if (logoPath.includes(s.id)) {
            stadium = s;
            break;
          }
        }
      }
      
      // If stadium found and has base64 logo, use it
      if (stadium && stadium.logoBase64) {
        return { 
          logoPath: stadium.logoBase64, 
          stadiumName: stadium.name, 
          stadiumId: stadium.id,
          isBase64: true 
        };
      }
      
      // Otherwise, use the logo path as-is
      if (stadium) {
        return { 
          logoPath: logoPath || '', 
          stadiumName: stadium.name,
          stadiumId: stadium.id
        };
      }
      
      return { logoPath: logoPath || '' };
    }).filter(logo => logo.logoPath);
  };

  // Get next occurrence of this day
  const getNextDate = (dayOfWeek) => {
    const today = new Date();
    const currentDay = today.getDay();
    const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = dayMap[dayOfWeek];
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate;
  };

  // Format date for display
  const formatDate = (date) => {
    const day = date.getDate();
    const monthNames = language === 'th'
      ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[date.getMonth()]}`;
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <section id="tickets" className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 uppercase tracking-tight">
                {t.upcomingFights.title}
              </h2>
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
            </div>
            <p className="text-gray-400 text-sm sm:text-base uppercase tracking-wider">
              {language === 'th' ? 'ตารางการแข่งขันมวยไทยรายสัปดาห์' : 'Weekly Muay Thai Fight Schedule'}
            </p>
          </div>
        </AnimatedSection>

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 sm:gap-6">
          {days.map((day, index) => {
            const weeklyFight = weeklyFights[day];
            const config = dayConfig[day];
            const nextDate = getNextDate(day);
            const logos = getStadiumLogos(weeklyFight);
            const isHovered = hoveredDay === day;
            const hasFight = weeklyFight && (weeklyFight.image || logos.length > 0);

            return (
              <AnimatedItem key={day} delay={index * 50}>
                <div
                  className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${
                    hasFight ? 'opacity-100' : 'opacity-60'
                  }`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => {
                    if (onBookClick && hasFight) {
                      onBookClick();
                    }
                  }}
                >
                  {/* Card */}
                  <div className={`
                    relative h-full w-full rounded-xl overflow-hidden
                    border-2 ${config.borderColor} ${isHovered ? 'border-opacity-100 shadow-2xl' : 'border-opacity-50'}
                    ${config.bgColor}
                    backdrop-blur-sm
                    transition-all duration-300
                    min-w-[180px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]
                  `}>
                    {/* Background Image */}
                    {weeklyFight?.image && (
                      <div 
                        className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                        style={{
                          backgroundImage: `url(${weeklyFight.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${config.color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />

                    {/* Content */}
                    <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col h-full min-h-[280px] sm:min-h-[320px]">
                      {/* Day Header */}
                      <div className="flex items-center justify-center mb-4 relative">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl">{config.icon}</span>
                          <div className="text-center">
                            <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${config.textColor}`}>
                              {config.labelShort}
                            </div>
                            <div className="text-white text-xs opacity-75">
                              {formatDate(nextDate)}
                            </div>
                          </div>
                        </div>
                        {hasFight && (
                          <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        )}
                      </div>

                      {/* Day Label */}
                      <div className="mb-4 flex flex-col items-center justify-center">
                        <div className="w-full flex justify-center">
                          <h3 className={`text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight ${config.textColor} mb-2 text-center inline-block`}>
                            {config.label}
                          </h3>
                        </div>
                        {hasFight && (
                          <div className="flex items-center justify-center gap-2 text-white/80 text-xs sm:text-sm">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{language === 'th' ? '20:00 น.' : '8:00 PM'}</span>
                          </div>
                        )}
                      </div>

                      {/* Stadium Logos */}
                      {logos.length > 0 && (
                        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 mb-4">
                          {logos.map((logoInfo, idx) => (
                            <div 
                              key={idx}
                              className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20 group-hover:bg-white/20 transition-all duration-300"
                            >
                              <img
                                src={logoInfo.logoPath}
                                alt={logoInfo.stadiumName || 'Stadium'}
                                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain filter brightness-0 invert"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.parentElement.querySelector('.logo-fallback');
                                  if (fallback) fallback.style.display = 'block';
                                }}
                              />
                              <div className="logo-fallback text-white text-[8px] sm:text-xs font-bold uppercase tracking-wide hidden text-center">
                                {logoInfo.stadiumName || 'STADIUM'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Fight Message */}
                      {!hasFight && (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center text-white/50 text-xs sm:text-sm">
                            {language === 'th' ? 'ไม่มีรายการ' : 'No fights'}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {hasFight && (
                        <div className="mt-auto pt-4 border-t border-white/20">
                          <button
                            className={`
                              w-full flex items-center justify-center gap-2
                              px-4 py-2 sm:py-3
                              rounded-lg
                              font-bold text-sm sm:text-base
                              uppercase tracking-wider
                              transition-all duration-300
                              transform group-hover:scale-105
                              ${config.textColor.replace('text-', 'bg-').replace('-400', '-600')} 
                              text-white
                              hover:shadow-lg
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onBookClick) {
                                onBookClick();
                              }
                            }}
                          >
                            <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{t.upcomingFights.bookTickets}</span>
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    {isHovered && (
                      <div className={`absolute inset-0 rounded-xl ${config.bgColor} opacity-50 blur-xl -z-10`} />
                    )}
                  </div>
                </div>
              </AnimatedItem>
            );
          })}
        </div>

        {/* Info Banner */}
        <AnimatedSection delay={400}>
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                    {language === 'th' ? 'จองตั๋วล่วงหน้า' : 'Book in Advance'}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base">
                    {language === 'th' 
                      ? 'จองตั๋วล่วงหน้าเพื่อรับที่นั่งที่ดีที่สุด' 
                      : 'Book your tickets in advance for the best seats'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider text-sm sm:text-base whitespace-nowrap"
              >
                {language === 'th' ? 'จองตอนนี้' : 'Book Now'}
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default UpcomingFightsSection;
