import React from 'react';
import { Crown, Trophy, Eye, Globe, Hand, Users } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import AnimatedItem from './AnimatedItem';

const AboutSection = ({ t }) => {
  return (
    <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-12 text-red-600">{t.about.title}</h2>
        </AnimatedSection>

        {/* Experience Section */}
        <AnimatedItem delay={0}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-6 relative">
                {t.about.lumpinee.experienceTitle}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-gray-700">
                {t.about.lumpinee.experienceDesc}
              </p>
            </div>
          </div>
        </AnimatedItem>

        {/* Why Choose Section */}
        <AnimatedItem delay={100}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-8 relative">
                {t.about.lumpinee.whyChooseTitle}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Crown className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.whyChoose1}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Trophy className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.whyChoose2}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Eye className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.whyChoose3}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Globe className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.whyChoose4}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Ticket Types Section */}
        <AnimatedItem delay={200}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-6 relative">
                {t.about.lumpinee.ticketTypesTitle}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <p className="text-lg mb-8 text-gray-700">{t.about.lumpinee.ticketTypesIntro}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Ringside Seats */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Hand className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">{t.about.lumpinee.ringsideSeats}</h3>
                  </div>
                  <p className="text-center mb-4">{t.about.lumpinee.ringsideDesc}</p>
                </div>
                
                {/* VIP Seats */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Crown className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">{t.about.lumpinee.vipSeats}</h3>
                  </div>
                  <p className="text-center mb-4">{t.about.lumpinee.vipSeatsDesc}</p>
                </div>
                
                {/* Standard Seats */}
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Users className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">{t.about.lumpinee.standardSeats}</h3>
                  </div>
                  <p className="text-center mb-4">{t.about.lumpinee.standardSeatsDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* Booking Instructions */}
        <AnimatedItem delay={300}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-6 relative">
                {t.about.lumpinee.howToBookTitle}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.howToBook1}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.howToBook2}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">3</span>
                  </div>
                  <p className="font-semibold text-gray-900">{t.about.lumpinee.howToBook3}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* FAQ Section - Lumpinee */}
        <AnimatedItem delay={400}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-8 relative">
                {t.about.lumpinee.faqTitle}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.about.lumpinee.faq1q}</h3>
                  <p className="text-gray-700">{t.about.lumpinee.faq1a}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.about.lumpinee.faq2q}</h3>
                  <p className="text-gray-700">{t.about.lumpinee.faq2a}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.about.lumpinee.faq3q}</h3>
                  <p className="text-gray-700">{t.about.lumpinee.faq3a}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* General FAQ Section */}
        <AnimatedItem delay={500}>
          <div className="py-12 bg-white rounded-lg">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-8 relative">
                {t.faq.title}
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q1}</h3>
                  <p className="text-gray-700">{t.faq.a1}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q2}</h3>
                  <p className="text-gray-700">{t.faq.a2}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q3}</h3>
                  <p className="text-gray-700">{t.faq.a3}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q4}</h3>
                  <p className="text-gray-700">{t.faq.a4}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q5}</h3>
                  <p className="text-gray-700">{t.faq.a5}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t.faq.q6}</h3>
                  <p className="text-gray-700">{t.faq.a6}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>
      </div>
    </section>
  );
};

export default AboutSection;

