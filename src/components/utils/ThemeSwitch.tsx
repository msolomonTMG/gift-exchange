import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { type FC,useEffect, useState } from 'react';
import { DARK_THEME, LIGHT_THEME } from '~/constants/theme';

interface Props {
  toggle?: boolean;
}

const ThemeSwitch: FC<Props> = ({ toggle }) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  // check if the user's system prefers dark mode
  // if so, set the theme to dark
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme(DARK_THEME);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, []);

  const handleThemeUpdate = () => {
    setTheme(theme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
  }

  if (!mounted) {
    return null
  }

  if (toggle) {
    return (
      <input 
        type="checkbox" 
        className="toggle toggle-lg" checked={theme === LIGHT_THEME}
        onChange={() => void handleThemeUpdate()}
      />
    )
  }

  return (
    <label className="swap swap-rotate btn btn-sm btn-ghost">
      <input 
        type="checkbox" 
        checked={theme === LIGHT_THEME} 
        onChange={() => void handleThemeUpdate()}
      />
      <SunIcon className="swap-on w-4 h-4 stroke-2" />
      <MoonIcon className="swap-off w-4 h-4 stroke-2" />
    </label>
  )
}

export default ThemeSwitch;