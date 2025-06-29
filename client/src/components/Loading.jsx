import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Loading = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const nextUrl = query.get('next');

  useEffect(() => {
    console.log("Navigating to:", nextUrl);
    if (nextUrl) {
      const timer = setTimeout(() => {
        navigate(nextUrl);
      }, 500);

      return () => clearTimeout(timer); // Clean up
    }
  }, [nextUrl, navigate]);

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary'></div>
    </div>
  );
};

export default Loading;
