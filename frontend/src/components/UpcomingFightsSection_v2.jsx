import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Ticket, ChevronRight, Flame, Zap, Trophy, Star } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import AnimatedItem from './AnimatedItem';

const UpcomingFightsSection = ({ weeklyFights, language, stadiums, t, onBookClick }) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Day configuration with BOLD colors and powerful icons
  const dayConfig = {
    monday: {
      label: language === 'th' ? 'จันทร์' : 'MONDAY',
      labelShort: language === 'th' ? 'จ' : 'MON',
      gradient: 'from-blue-600 via-blue-700 to-blue-900',
      borderGlow: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-blue-600/30 via-blue-700/20 to-transparent',
      icon: '🥊',
      accentColor: 'text-blue-400'
    },
    tuesday: {
      label: language === 'th' ? 'อังคาร' : 'TUESDAY',
      labelShort: language === 'th' ? 'อ' : 'TUE',
      gradient: 'from-purple-600 via-purple-800 to-indigo-900',
      borderGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-purple-600/30 via-purple-800/20 to-transparent',
      icon: '💪',
      accentColor: 'text-purple-400'
    },
    wednesday: {
      label: language === 'th' ? 'พุธ' : 'WEDNESDAY',
      labelShort: language === 'th' ? 'พ' : 'WED',
      gradient: 'from-amber-600 via-orange-700 to-red-900',
      borderGlow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-amber-600/30 via-orange-700/20 to-transparent',
      icon: '🔥',
      accentColor: 'text-amber-400'
    },
    thursday: {
      label: language === 'th' ? 'พฤหัสบดี' : 'THURSDAY',
      labelShort: language === 'th' ? 'พฤ' : 'THU',
      gradient: 'from-emerald-600 via-green-700 to-teal-900',
      borderGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-emerald-600/30 via-green-700/20 to-transparent',
      icon: '⚡',
      accentColor: 'text-emerald-400'
    },
    friday: {
      label: language === 'th' ? 'ศุกร์' : 'FRIDAY',
      labelShort: language === 'th' ? 'ศ' : 'FRI',
      gradient: 'from-orange-600 via-red-700 to-rose-900',
      borderGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-orange-600/30 via-red-700/20 to-transparent',
      icon: '👊',
      accentColor: 'text-orange-400'
    },
    saturday: {
      label: language === 'th' ? 'เสาร์' : 'SATURDAY',
      labelShort: language === 'th' ? 'ส' : 'SAT',
      gradient: 'from-red-600 via-red-800 to-red-950',
      borderGlow: 'shadow-[0_0_30px_rgba(220,38,38,0.6)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-red-600/30 via-red-800/20 to-transparent',
      icon: '🏆',
      accentColor: 'text-red-400'
    },
    sunday: {
      label: language === 'th' ? 'อาทิตย์' : 'SUNDAY',
      labelShort: language === 'th' ? 'อา' : 'SUN',
      gradient: 'from-pink-600 via-rose-700 to-fuchsia-900',
      borderGlow: 'shadow-[0_0_30px_rgba(236,72,153,0.5)]',
      textGlow: 'drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]',
      bgOverlay: 'bg-gradient-to-br from-pink-600/30 via-rose-700/20 to-transparent',
      icon: '⭐',
      accentColor: 'text-pink-400'
    }
  };

  const getStadiumLogos = (weeklyFight) => {
    if (!weeklyFight || !weeklyFight.logos) return [];
    
    return weeklyFight.logos.slice(0, 3).map(logoPath => {
      if (logoPath && logoPath.startsWith('data:')) {
        return { logoPath, isBase64: true };
      }
      
      let stadium = null;
      if (logoPath) {
        for (const s of stadiums) {
          if (logoPath.includes(s.id)) {
            stadium = s;
            break;
          }
        }
      }
      
      if (stadium && stadium.logoBase64) {
        return { 
          logoPath: stadium.logoBase64, 
          stadiumName: stadium.name, 
          stadiumId: stadium.id,
          isBase64: true 
        };
      }
      
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

  const getNextDate = (dayOfWeek) => {
    const today = new Date();
    const currentDay = today.getDay();
    const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = dayMap[dayOfWeek];
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate;
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const monthNames = language === 'th'
      ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day} ${monthNames[date.getMonth()]}`;
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <section id="tickets" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-orange-950/20"></div>
      </div>

      {/* Glowing particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-600/10 rounded-full blur-[100px] animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Epic Header */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-4 mb-6">
              <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter relative">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                  {t.upcomingFights.title}
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 blur-2xl opacity-20 -z-10"></div>
              </h2>
              <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
            </div>
            <p className="text-gray-400 text-lg uppercase tracking-[0.3em] font-bold">
              {language === 'th' ? '⚡ สนามรบมวยไทย 7 วัน ⚡' : '⚡ 7 DAYS OF COMBAT ⚡'}
            </p>
          </div>
        </AnimatedSection>

        {/* Battle Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
          {days.map((day, index) => {
            const weeklyFight = weeklyFights[day];
            const config = dayConfig[day];
            const nextDate = getNextDate(day);
            const logos = getStadiumLogos(weeklyFight);
            const isHovered = hoveredDay === day;
            const hasFight = weeklyFight && (weeklyFight.image || logos.length > 0);

            return (
              <AnimatedItem key={day} delay={index * 75}>
                <div
                  className={`relative group cursor-pointer transition-all duration-500 transform ${
                    isHovered ? 'scale-110 -translate-y-4 z-20' : 'hover:scale-105 hover:-translate-y-2'
                  } ${hasFight ? 'opacity-100' : 'opacity-60'}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => {
                    if (onBookClick && hasFight) {
                      onBookClick();
                    }
                  }}
                >
                  {/* Battle Card */}
                  <div className={`
                    relative rounded-2xl overflow-hidden
                    border-4 border-white/10
                    ${isHovered ? config.borderGlow : ''}
                    backdrop-blur-sm
                    transition-all duration-500
                    min-h-[350px] sm:min-h-[400px]
                    bg-gradient-to-br ${config.gradient}
                  `}>
                    {/* Background Image with Dramatic Effect */}
                    {weeklyFight?.image && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={weeklyFight.image}
                          alt={config.label}
                          className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110"
                          style={{ filter: 'grayscale(30%) contrast(1.2)' }}
                        />
                      </div>
                    )}

                    {/* Powerful Gradient Overlay */}
                    <div className={`absolute inset-0 ${config.bgOverlay} opacity-90 group-hover:opacity-95 transition-opacity duration-500`} />

                    {/* Diagonal Strike Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/30 group-hover:from-white/10 transition-all duration-500"></div>

                    {/* Content */}
                    <div className="relative z-10 p-5 flex flex-col h-full min-h-[350px] sm:min-h-[400px]">
                      {/* Day Header with Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl animate-bounce-slow">{config.icon}</div>
                          <div>
                            <div className={`text-sm font-black uppercase tracking-widest ${config.accentColor} ${config.textGlow}`}>
                              {config.labelShort}
                            </div>
                            <div className="text-white/80 text-xs font-bold">
                              {formatDate(nextDate)}
                            </div>
                          </div>
                        </div>
                        {hasFight && (
                          <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-ping absolute"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                        )}
                      </div>

                      {/* MASSIVE Day Label */}
                      <div className="mb-6 flex flex-col items-center justify-center flex-1">
                        <h3 className={`
                          text-2xl sm:text-3xl md:text-4xl font-black uppercase 
                          text-center leading-none tracking-tighter
                          text-white
                          ${config.textGlow}
                          transform group-hover:scale-110 transition-transform duration-500
                        `}>
                          {config.label}
                        </h3>
                        
                        {/* Strike Line Effect */}
                        <div className={`w-16 h-1 ${config.accentColor} mt-3 rounded-full group-hover:w-24 transition-all duration-500`}></div>

                        {hasFight && (
                          <div className="flex items-center gap-2 text-white/90 text-sm font-bold mt-3">
                            <Clock className="w-4 h-4" />
                            <span>20:00</span>
                          </div>
                        )}
                      </div>

                      {/* Stadium Logos */}
                      {logos.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mb-4">
                          {logos.map((logoInfo, idx) => (
                            <div 
                              key={idx}
                              className="bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/20 group-hover:bg-black/60 group-hover:border-white/40 transition-all duration-300"
                            >
                              <img
                                src={logoInfo.logoPath}
                                alt={logoInfo.stadiumName || 'Stadium'}
                                className="w-12 h-12 object-contain filter brightness-0 invert group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Fight Message */}
                      {!hasFight && (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center text-white/40 text-sm font-bold uppercase">
                            {language === 'th' ? 'พักการแข่งขัน' : 'NO BATTLE'}
                          </div>
                        </div>
                      )}

                      {/* Epic Action Button */}
                      {hasFight && (
                        <button
                          className={`
                            w-full flex items-center justify-center gap-2
                            px-4 py-3 rounded-xl
                            font-black text-sm uppercase tracking-wider
                            bg-gradient-to-r ${config.gradient}
                            text-white
                            border-2 border-white/30
                            hover:border-white/60
                            hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                            transform group-hover:scale-105
                            transition-all duration-300
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBookClick) {
                              onBookClick();
                            }
                          }}
                        >
                          <Ticket className="w-5 h-5" />
                          <span>{t.upcomingFights.bookTickets}</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    {isHovered && (
                      <div className={`absolute -inset-2 bg-gradient-to-r ${config.gradient} opacity-30 blur-2xl -z-10 animate-pulse`}></div>
                    )}
                  </div>
                </div>
              </AnimatedItem>
            );
          })}
        </div>

        {/* Call to Action Banner */}
        <AnimatedSection delay={500}>
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-yellow-600/20 blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-red-950/80 via-orange-950/80 to-yellow-950/80 border-2 border-orange-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-2xl mb-2 uppercase">
                      {language === 'th' ? 'จองตั๋วล่วงหน้าวันนี้!' : 'SECURE YOUR SEAT NOW!'}
                    </h3>
                    <p className="text-orange-300 text-base font-bold">
                      {language === 'th' 
                        ? 'ที่นั่งจำกัด! จองเลยเพื่อรับที่นั่งพิเศษ' 
                        : 'Limited seats! Book now for premium viewing'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-xl hover:from-orange-400 hover:to-red-500 transition-all uppercase tracking-wider text-lg shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.8)] transform hover:scale-105 border-2 border-white/30"
                >
                  {language === 'th' ? 'จองเลย!' : 'BOOK NOW!'}
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default UpcomingFightsSection;

