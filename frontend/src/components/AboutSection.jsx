import React from 'react';
import { CheckCircle, Smartphone, Users, Star, DollarSign, Shield } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import AnimatedItem from './AnimatedItem';

const AboutSection = ({ t }) => {
  return (
    <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-12 text-yellow-500">{t.about.title}</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatedItem delay={0}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <CheckCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.exp}</h3>
                <p className="text-gray-300">{t.about.expDesc}</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={100}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <Smartphone className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.online}</h3>
                <p className="text-gray-300">{t.about.onlineDesc}</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={200}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <Users className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.support}</h3>
                <p className="text-gray-300">{t.about.supportDesc}</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={300}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <Star className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.partners}</h3>
                <p className="text-gray-300">{t.about.partnersDesc}</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={400}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.pricing}</h3>
                <p className="text-gray-300">{t.about.pricingDesc}</p>
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={500}>
            <div className="flex items-start hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.about.secure}</h3>
                <p className="text-gray-300">{t.about.secureDesc}</p>
              </div>
            </div>
          </AnimatedItem>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

