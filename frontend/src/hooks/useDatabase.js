import { useState, useEffect } from 'react';
import { initDb, getHighlights, getStadiums, getWeeklyFights, getHeroImage, getStadiumImageSchedules, getSpecialMatches } from '../db/imagesDb';
import { parseDate } from '../utils/dateHelpers';

export const useDatabase = (language) => {
  const [heroImage, setHeroImage] = useState({ image: '/images/hero/hero-bg.jpg', alt: 'Muay Thai' });
  const [highlights, setHighlights] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [weeklyFights, setWeeklyFights] = useState({
    monday: { image: '', logos: [] },
    tuesday: { image: '', logos: [] },
    wednesday: { image: '', logos: [] },
    thursday: { image: '', logos: [] },
    friday: { image: '', logos: [] },
    saturday: { image: '', logos: [] },
    sunday: { image: '', logos: [] }
  });
  const [stadiumImageSchedules, setStadiumImageSchedules] = useState({
    rajadamnern: [],
    lumpinee: [],
    bangla: [],
    patong: []
  });
  const [specialMatches, setSpecialMatches] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDb();
        const heroData = await getHeroImage();
        const highlightsData = await getHighlights(language);
        const stadiumsData = await getStadiums(language);
        const weeklyFightsData = await getWeeklyFights();
        const schedulesData = await getStadiumImageSchedules();
        const specialMatchesData = await getSpecialMatches();
        
        setHeroImage(heroData);
        setHighlights(highlightsData);
        setStadiums(stadiumsData);
        setWeeklyFights(weeklyFightsData);
        setStadiumImageSchedules(schedulesData);
        setSpecialMatches(specialMatchesData);
        setDbLoaded(true);
      } catch (error) {
        console.error('Error loading database:', error);
        // Fallback to default data if database fails
        setDbLoaded(true);
      }
    };
    loadData();
  }, []);

  // Reload data when language changes
  useEffect(() => {
    if (dbLoaded) {
      const reloadData = async () => {
        try {
          const highlightsData = await getHighlights(language);
          const stadiumsData = await getStadiums(language);
          const weeklyFightsData = await getWeeklyFights();
          
          setHighlights(highlightsData);
          setStadiums(stadiumsData);
          setWeeklyFights(weeklyFightsData);
        } catch (error) {
          console.error('Error reloading data:', error);
        }
      };
      reloadData();
    }
  }, [language, dbLoaded]);

  return {
    heroImage,
    highlights,
    stadiums,
    weeklyFights,
    stadiumImageSchedules,
    specialMatches,
    dbLoaded
  };
};

