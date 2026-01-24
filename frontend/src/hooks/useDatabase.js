import { useState, useEffect } from 'react';
import { initDb, getHighlights, getStadiums, getWeeklyFights, getHeroImage, getStadiumImageSchedules, getSpecialMatches, getDailyImages, getUpcomingFightsBackground, getBookingBackground } from '../db/imagesDb';
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
  const [bookingBackground, setBookingBackground] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Initialize database and load data (optimized for LCP and TBT)
  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      try {
        await initDb();
        if (cancelled) return;
        
        // Load hero image first (priority for LCP) - this is critical
        const heroData = await getHeroImage();
        if (!cancelled) {
          setHeroImage(heroData);
        }
        
        // Load all other data in parallel but with staggered state updates to reduce TBT
        const [
          highlightsData,
          stadiumsData,
          weeklyFightsData,
          schedulesData,
          specialMatchesData,
          dailyImagesData,
          backgroundData,
          bookingBackgroundData
        ] = await Promise.allSettled([
          getHighlights(language),
          getStadiums(language),
          getWeeklyFights(),
          getStadiumImageSchedules(),
          getSpecialMatches(),
          getDailyImages(),
          getUpcomingFightsBackground(),
          getBookingBackground()
        ]);
        
        if (cancelled) return;
        
        // Update state in batches to reduce blocking time
        // Use requestAnimationFrame to spread updates across frames
        const updateState = (setter, value) => {
          requestAnimationFrame(() => {
            if (!cancelled) setter(value);
          });
        };
        
        if (highlightsData.status === 'fulfilled') updateState(setHighlights, highlightsData.value);
        if (stadiumsData.status === 'fulfilled') updateState(setStadiums, stadiumsData.value);
        if (weeklyFightsData.status === 'fulfilled') updateState(setWeeklyFights, weeklyFightsData.value);
        if (schedulesData.status === 'fulfilled') updateState(setStadiumImageSchedules, schedulesData.value);
        if (specialMatchesData.status === 'fulfilled') updateState(setSpecialMatches, specialMatchesData.value);
        if (dailyImagesData.status === 'fulfilled') updateState(setDailyImages, dailyImagesData.value);
        if (backgroundData.status === 'fulfilled') updateState(setUpcomingFightsBackground, backgroundData.value);
        if (bookingBackgroundData.status === 'fulfilled') updateState(setBookingBackground, bookingBackgroundData.value);
        
        // Set dbLoaded after a short delay to allow initial render
        requestAnimationFrame(() => {
          if (!cancelled) setDbLoaded(true);
        });
      } catch (error) {
        console.error('Error loading database:', error);
        if (!cancelled) setDbLoaded(true);
      }
    };
    
    // Start loading immediately but don't block render
    // The page will show with fallback image first, then update when API responds
    loadData();
    
    return () => {
      cancelled = true;
    };
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
    bookingBackground,
    dbLoaded
  };
};

