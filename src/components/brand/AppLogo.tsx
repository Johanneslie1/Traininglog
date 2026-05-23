import React from 'react';
import { APP_LOGO_ALT, APP_LOGO_SRC } from './logo';

interface AppLogoProps {
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = 'h-10 w-10' }) => (
  <img
    src={APP_LOGO_SRC}
    alt={APP_LOGO_ALT}
    className={`${className} rounded-2xl object-contain`}
    draggable={false}
  />
);

export default AppLogo;
