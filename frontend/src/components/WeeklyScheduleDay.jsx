import React from 'react';

const WeeklyScheduleDay = ({ weeklyFight, dayLabel, language, stadiums, dayOfWeek }) => {
  // Show component even if no image, but hide if weeklyFight is completely missing
  if (!weeklyFight) return null;

  // Get stadium time based on stadium ID
  const getStadiumTime = (stadiumId) => {
    const times = {
      'rajadamnern': '18:00 - 22:00',
      'lumpinee': '18:00 - 22:30',
      'bangla': '21:00 - 23:00',
      'patong': '21:00 - 23:00'
    };
    return times[stadiumId] || '';
  };

  // Get logo component from logo path
  const getLogoComponent = (logoInfo, logoCount, index) => {
    // Determine logo size based on count
    // Mobile: smaller, Desktop: normal size
    const getMobileLogoSize = () => {
      if (logoCount === 3) {
        return { maxWidth: '80px', maxHeight: '50px' };
      } else if (logoCount === 2) {
        return { maxWidth: '100px', maxHeight: '60px' };
      } else {
        return { maxWidth: '120px', maxHeight: '70px' };
      }
    };
    
    const getDesktopLogoSize = () => {
      if (logoCount === 3) {
        return { maxWidth: '200px', maxHeight: '120px' };
      } else if (logoCount === 2) {
        return { maxWidth: '250px', maxHeight: '150px' };
      } else {
        return { maxWidth: '300px', maxHeight: '180px' };
      }
    };
    
    const mobileLogoSize = getMobileLogoSize();
    const desktopLogoSize = getDesktopLogoSize();
    
    const logoPath = logoInfo.logoPath;
    const stadiumName = logoInfo.stadiumName || 'STADIUM';
    const stadiumId = logoInfo.stadiumId || '';
    const stadiumTime = getStadiumTime(stadiumId);
    const isBase64 = logoInfo.isBase64 || logoPath.startsWith('data:');
    
    // If it's base64, use it directly; otherwise handle file path
    const defaultLogo = isBase64 ? logoPath : (() => {
      const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
      const hasExtension = /\.(png|jpg|jpeg|svg|webp)$/i.test(logoPath);
      return hasExtension ? logoPath : `${logoPath}.png`;
    })();
    
    return (
      <div className="text-center flex flex-col items-center justify-center h-full relative">
        <div className="flex-1 flex items-center justify-center">
          <style>{`
            @media (min-width: 640px) {
              .logo-${logoCount}-${index} {
                max-width: ${desktopLogoSize.maxWidth} !important;
                max-height: ${desktopLogoSize.maxHeight} !important;
              }
            }
          `}</style>
          <img
            src={defaultLogo}
            alt={`${stadiumName} logo`}
            className={`max-w-full max-h-full object-contain logo-${logoCount}-${index}`}
            style={mobileLogoSize}
            onError={(e) => {
              if (isBase64) {
                // Base64 images shouldn't fail, but if they do, show fallback
                e.target.style.display = 'none';
                const fallback = e.target.parentElement.querySelector('.logo-fallback');
                if (fallback) fallback.style.display = 'block';
                return;
              }
              
              // Try other extensions if PNG fails
              const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
              const currentSrc = e.target.src;
              const hasExtension = /\.(png|jpg|jpeg|svg|webp)$/i.test(currentSrc);
              
              if (!hasExtension) {
                const basePath = currentSrc.replace(/\.(png|jpg|jpeg|svg|webp)$/, '');
                const currentExt = currentSrc.match(/\.(png|jpg|jpeg|svg|webp)$/)?.[1];
                const extIndex = extensions.indexOf(currentExt || 'png');
                
                if (extIndex < extensions.length - 1) {
                  // Try next extension
                  e.target.src = `${basePath}.${extensions[extIndex + 1]}`;
                  return;
                }
              }
              // All extensions failed, hide image and show text fallback
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.logo-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          {/* Fallback text if logo image fails to load */}
          <div className="logo-fallback text-white text-xs sm:text-sm font-bold uppercase tracking-wide drop-shadow-lg hidden">
            {stadiumName}
          </div>
        </div>
        {/* Stadium time below logo */}
        {stadiumTime && (
          <div className="mt-1 sm:mt-2 pb-1 sm:pb-2">
            <div className="text-gray-400 text-[10px] sm:text-xs md:text-sm">
              {stadiumTime}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get border color for each day - different colors but matching the background tone
  const getDayBorderColor = () => {
    const borderColors = {
      monday: 'border-amber-400',      // Light gold
      tuesday: 'border-amber-500',     // Medium gold
      wednesday: 'border-amber-600',   // Dark gold
      thursday: 'border-yellow-600',   // Yellow-gold
      friday: 'border-amber-500',      // Medium gold
      saturday: 'border-red-600',      // Red (matches Saturday's red background)
      sunday: 'border-yellow-500'      // Yellow-gold
    };
    return borderColors[dayOfWeek] || 'border-amber-500';
  };

  // Get logos from weeklyFight (max 3)
  const logos = (weeklyFight.logos || []).slice(0, 3).map(logoPath => {
    // Try to find matching stadium by ID in logo path first
    let stadium = null;
    if (logoPath) {
      // Try to match stadium ID from logo path (e.g., '/images/stadium-logos/rajadamnern-logo.png' -> 'rajadamnern')
      for (const s of stadiums) {
        if (logoPath.includes(s.id)) {
          stadium = s;
          break;
        }
      }
    }
    
    // Check if it's a base64 data URI
    if (logoPath && logoPath.startsWith('data:')) {
      return { 
        logoPath, 
        isBase64: true,
        stadiumName: stadium?.name || '',
        stadiumId: stadium?.id || ''
      };
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
    
    // Otherwise, use the logo path as-is and try to find stadium name
    if (stadium) {
      return { 
        logoPath: logoPath || '', 
        stadiumName: stadium.name,
        stadiumId: stadium.id
      };
    }
    
    // If no stadium match, just return the path
    return { logoPath: logoPath || '' };
  }).filter(logo => logo.logoPath);
  const logoCount = logos.length;

  return (
    <div 
      className={`relative overflow-hidden border-t-2 border-b-2 ${getDayBorderColor()} flex flex-col sm:flex-row h-auto sm:h-48 md:h-52 lg:h-56 xl:h-60`}
    >
      {/* Mobile: Day on top, Desktop: Day on left */}
      <div className="relative flex flex-col items-center justify-center px-1 sm:px-2 md:px-4 overflow-hidden py-1 sm:py-0 sm:w-[25%]">
        {/* Background Color - Different color for each day */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: (() => {
              const dayColors = {
                monday: '#ca8a04',      // Yellow-gold (yellow-600/amber-600)
                tuesday: '#854d0e',     // Slightly lighter gold/brown
                wednesday: '#92400e',   // Medium gold/brown
                thursday: '#a16207',    // Lighter gold/brown
                friday: '#78350f',      // Dark gold/brown
                saturday: '#7f1d1d',    // Dark red (red-900)
                sunday: '#92400e'      // Medium gold/brown (same as Wednesday)
              };
              return dayColors[dayOfWeek] || '#78350f';
            })()
          }}
        ></div>
        {/* Content */}
        <div className="relative z-10">
          <div className="text-white text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase tracking-wider drop-shadow-lg px-1 leading-tight">
            {dayLabel}{language === 'th' ? '' : 'S'}
          </div>
        </div>
      </div>

      {/* Mobile: Logos below in row, Desktop: Logos on right */}
      <div 
        className="bg-gray-900 flex flex-row sm:grid h-auto sm:h-full sm:flex-1 overflow-x-auto sm:overflow-x-visible"
        style={{ 
          gridTemplateColumns: `repeat(${logoCount || 1}, 1fr)`
        }}
      >
        {logos.map((logoInfo, index) => (
          <div 
            key={index}
            className="cursor-pointer flex items-center justify-center px-1 sm:px-2 md:px-4 py-2 sm:py-0 border-r border-gray-900 last:border-r-0 transition-transform duration-300 ease-in-out hover:scale-110 bg-transparent flex-shrink-0 sm:flex-shrink"
            style={{ minWidth: logoCount === 1 ? '100%' : logoCount === 2 ? '50%' : '33.33%' }}
          >
            {getLogoComponent(logoInfo, logoCount, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyScheduleDay;

