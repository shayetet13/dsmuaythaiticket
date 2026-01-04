import React from 'react';
import { MapPin, Phone, Mail, Calendar } from 'lucide-react';

const Footer = ({ language, stadiums, t }) => {
  return (
    <footer id="footer" className="bg-black border-t-2 border-red-600 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
          {/* Contact */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-yellow-500 mb-4 sm:mb-6 uppercase tracking-wider">
              {t.contact.title}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-500" />
                {language === 'th' ? 'กรุงเทพ, ประเทศไทย' : 'Bangkok, Thailand'}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-500" />
                +66 123 456 789
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-yellow-500" />
                info@ftmuaythaitickets.com
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                {language === 'th' ? 'จ-อา: 09:00-21:00' : 'Mon-Sun: 9:00-21:00'}
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-yellow-500 mb-4 sm:mb-6 uppercase tracking-wider">
              {language === 'th' ? 'ลิงก์ด่วน' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><a href="#tickets" className="text-gray-400 hover:text-yellow-400 transition-colors">{t.upcomingFights.title}</a></li>
              <li><a href="#booking" className="text-gray-400 hover:text-yellow-400 transition-colors">{language === 'th' ? 'ราคาตั๋ว' : 'Ticket Prices'}</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-yellow-400 transition-colors">{t.nav.about}</a></li>
            </ul>
          </div>

          {/* Venues */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-yellow-500 mb-4 sm:mb-6 uppercase tracking-wider">
              {language === 'th' ? 'สนามมวย' : 'Venues'}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              {stadiums.map((stadium) => (
                <li key={stadium.id}>
                  <a href="#tickets" className="text-gray-400 hover:text-yellow-400 transition-colors">{stadium.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-yellow-500 mb-4 sm:mb-6 uppercase tracking-wider">
              {language === 'th' ? 'ติดตามเรา' : 'Follow Us'}
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Facebook</a></li>
              <li><a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center">
          <p className="text-gray-500 text-xs sm:text-sm px-2">
            {t.footer.copyright}
          </p>
          <p className="text-gray-600 text-[10px] sm:text-xs mt-2 px-2">
            {t.footer.description}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

