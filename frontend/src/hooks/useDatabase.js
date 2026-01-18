import { useState, useEffect } from 'react';
import { initDb, getHighlights, getStadiums, getWeeklyFights, getHeroImage, getStadiumImageSchedules, getSpecialMatches, getDailyImages, getUpcomingFightsBackground } from '../db/imagesDb';
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
  const [dailyImages, setDailyImages] = useState([]);
  const [upcomingFightsBackground, setUpcomingFightsBackground] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Initialize database and load data (defer to avoid blocking FCP)
  useEffect(() => {
    // Use requestIdleCallback or setTimeout to defer non-critical API calls
    // This allows the page to render first before making API calls
    const loadData = async () => {
      try {
        await initDb();
        
        // Load hero image first (priority for LCP), then load other data in parallel
        const heroData = await getHeroImage();
        setHeroImage(heroData);
        
        // Load all other data in parallel for faster loading
        const [
          highlightsData,
          stadiumsData,
          weeklyFightsData,
          schedulesData,
          specialMatchesData,
          dailyImagesData,
          backgroundData
        ] = await Promise.allSettled([
          getHighlights(language),
          getStadiums(language),
          getWeeklyFights(),
          getStadiumImageSchedules(),
          getSpecialMatches(),
          getDailyImages(),
          getUpcomingFightsBackground()
        ]);
        
        // Set data from successful promises
        if (highlightsData.status === 'fulfilled') setHighlights(highlightsData.value);
        if (stadiumsData.status === 'fulfilled') setStadiums(stadiumsData.value);
        if (weeklyFightsData.status === 'fulfilled') setWeeklyFights(weeklyFightsData.value);
        if (schedulesData.status === 'fulfilled') setStadiumImageSchedules(schedulesData.value);
        if (specialMatchesData.status === 'fulfilled') setSpecialMatches(specialMatchesData.value);
        if (dailyImagesData.status === 'fulfilled') setDailyImages(dailyImagesData.value);
        if (backgroundData.status === 'fulfilled') setUpcomingFightsBackground(backgroundData.value);
        
        setDbLoaded(true);
      } catch (error) {
        console.error('Error loading database:', error);
        // Fallback to default data if database fails
        setDbLoaded(true);
      }
    };
    
    // Start loading immediately but don't block render
    // The page will show with fallback image first, then update when API responds
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
    dailyImages,
    upcomingFightsBackground,
    dbLoaded
  };
};

