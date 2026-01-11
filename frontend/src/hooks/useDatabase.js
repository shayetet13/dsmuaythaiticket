import { useState, useEffect } from 'react';
import { initDb, getHighlights, getStadiums, getWeeklyFights, getHeroImage, getStadiumImageSchedules, getSpecialMatches, getUpcomingFightsBackground } from '../db/imagesDb';
import { parseDate } from '../utils/dateHelpers';

export const useDatabase = (language) => {
  // Don't use default images - wait for API to load
  const [heroImage, setHeroImage] = useState(null);
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
  const [upcomingFightsBackground, setUpcomingFightsBackground] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDb();
        const heroData = await getHeroImage();
        console.log('[useDatabase] Hero image loaded:', heroData);
        const highlightsData = await getHighlights(language);
        const stadiumsData = await getStadiums(language);
        const weeklyFightsData = await getWeeklyFights();
        const schedulesData = await getStadiumImageSchedules();
        const specialMatchesData = await getSpecialMatches();
        const backgroundData = await getUpcomingFightsBackground();
        
        setHeroImage(heroData);
        setHighlights(highlightsData);
        setStadiums(stadiumsData);
        setWeeklyFights(weeklyFightsData);
        setStadiumImageSchedules(schedulesData);
        setSpecialMatches(specialMatchesData);
        setUpcomingFightsBackground(backgroundData);
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
    upcomingFightsBackground,
    dbLoaded
  };
};

