import React from 'react';
import { Phone, Mail } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import AnimatedItem from './AnimatedItem';

const ContactSection = ({ t }) => {
  return (
    <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-8 text-yellow-500">{t.contact.title}</h2>
          <p className="text-gray-300 mb-8">
            {t.contact.description}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <AnimatedItem delay={0}>
              <div className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors">
                <Phone className="w-5 h-5 mr-2 text-yellow-500" />
                <span>+66 123 456 789</span>
              </div>
            </AnimatedItem>
            <AnimatedItem delay={100}>
              <div className="flex items-center text-gray-300 hover:text-yellow-400 transition-colors">
                <Mail className="w-5 h-5 mr-2 text-yellow-500" />
                <span>info@ftmuaythaitickets.com</span>
              </div>
            </AnimatedItem>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ContactSection;

