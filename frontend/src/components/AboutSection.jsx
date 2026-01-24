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
                Experience World-Class Muay Thai at Lumpinee Stadium
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <p className="text-lg leading-relaxed mb-6 text-gray-700">
                Watching a fight at <strong>Lumpinee Stadium</strong> is an unforgettable experience.
                The stadium features modern facilities, professional lighting, and high-energy fight nights that showcase the very best of Muay Thai.
              </p>
            </div>
          </div>
        </AnimatedItem>

        {/* Why Choose Section */}
        <AnimatedItem delay={100}>
          <div className="py-12 bg-white rounded-lg mb-8">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-8 relative">
                Why Choose Lumpinee Stadium?
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Crown className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">Thailand's most prestigious Muay Thai stadium</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Trophy className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">Home of championship-level fighters</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Eye className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">Modern venue with excellent visibility</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center hover:transform hover:scale-105 transition-transform duration-300">
                  <Globe className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                  <p className="font-semibold text-gray-900">Popular among international visitors</p>
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
                Lumpinee Stadium Ticket Types
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <p className="text-lg mb-8 text-gray-700">We offer official tickets with the best available seats:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Ringside Seats */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Hand className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">Ringside Seats</h3>
                  </div>
                  <p className="text-center mb-4">Closest view, feel every strike and movement</p>
                </div>
                
                {/* VIP Seats */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Crown className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">VIP Seats</h3>
                  </div>
                  <p className="text-center mb-4">Comfortable seating with great angles</p>
                </div>
                
                {/* Standard Seats */}
                <div className="bg-gradient-to-br from-gray-700 to-gray-600 text-white p-6 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-4">
                    <Users className="w-16 h-16 mx-auto mb-3" />
                    <h3 className="text-xl sm:text-2xl font-bold">Standard Seats</h3>
                  </div>
                  <p className="text-center mb-4">Affordable and lively atmosphere</p>
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
                How to Book Lumpinee Stadium Tickets
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <p className="font-semibold text-gray-900">Select your preferred fight date</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <p className="font-semibold text-gray-900">Choose your seat category</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">3</span>
                  </div>
                  <p className="font-semibold text-gray-900">Contact our team for instant confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedItem>

        {/* FAQ Section */}
        <AnimatedItem delay={400}>
          <div className="py-12 bg-white rounded-lg">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-8 relative">
                Frequently Asked Questions – Lumpinee Stadium
                <span className="absolute bottom-[-8px] left-0 w-[60px] h-[3px] bg-gradient-to-r from-[#d4af37] to-[#f4c430] rounded"></span>
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Q: Can I buy Lumpinee Muay Thai tickets online?</h3>
                  <p className="text-gray-700">A: Yes, you can book official Lumpinee tickets online with instant confirmation.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Q: Which seats are best at Lumpinee Stadium?</h3>
                  <p className="text-gray-700">A: Ringside seats offer the closest action, while VIP seats provide the best overall view.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Q: Is Lumpinee Stadium suitable for tourists?</h3>
                  <p className="text-gray-700">A: Yes, the stadium is modern, tourist-friendly, and very popular with international visitors.</p>
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

