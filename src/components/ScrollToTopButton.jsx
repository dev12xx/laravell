import React, { useEffect, useState } from 'react';
import './css/ScrollToTopButton.css';

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      className={`scroll-to-top ${visible ? 'show' : ''}`}
      onClick={handleClick}
    >
      <svg className="arrow-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4l-6 6h4v6h4v-6h4z" fill="currentColor" />
      </svg>
    </button>
  );
}

export default ScrollToTopButton;
