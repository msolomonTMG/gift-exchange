import { type ReactNode, type FC, useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { APP_NAME } from "~/constants";

type Props = {
  children: ReactNode;
}
export const Layout: FC<Props> = ({ children }) => {
  // get session data from next-auth
  const { data: session } = useSession();
  const isDarkTheme = useIsDarkTheme();
  const [background, setBackground] = useState<string>('bg-base-100');
  
  useEffect(() => {
    if (!isDarkTheme) {
      setBackground('bg-base-100');
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setBackground('bg-base-100');
      return;
    }
    setBackground('bg-base-100');
  }, [isDarkTheme]);

  type NavbarItem = {
    name: string;
    href: string;
  }
  const navbarItems = useMemo(() => {
    return [
      { name: "Home", href: "/" },
      ...(session?.user ? [
        { name: "Admin", href: "/admin" },
        { name: "Logout", href: "/api/auth/signout" }
        ] : [
          { name: "Login", href: "/api/auth/signin" }
        ]
      ),
    ] as NavbarItem[];
  }, [session]);
  return (
    <div className="drawer">
      <input id="side-navigation-drawer" type="checkbox" className="drawer-toggle" /> 
      <div className={`drawer-content flex flex-col ${background}`}>
        <div className="navbar bg-base-200 mb-10 shadow-sm">
          <div className="max-w-7xl w-full mx-auto flex items-center">
            <div className="flex-none lg:hidden">
              <label htmlFor="side-navigation-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
              </label>
            </div> 
            <div className="flex-1">
              <Link className="btn btn-ghost normal-case text-xl" href="/">{APP_NAME}</Link>
            </div>
            <div className="items-center flex gap-2">
              <ul className="menu menu-horizontal hidden lg:flex">
                <ThemeSwitch />
                {navbarItems.map(item => (
                  <Link key={item.href} className="btn btn-sm btn-ghost" href={item.href}>
                    {item.name}
                  </Link>
                ))}
              </ul>
              {session?.user && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                    <div className="w-10 rounded-full">
                      <Image 
                        src={session.user.image ?? ""}
                        alt="Profile Picture"
                        width={40}
                        height={40}
                      />
                    </div>
                  </label>
                  <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-200 rounded-box w-52">
                    <li>
                      <a className="justify-between">
                        Profile
                        <span className="badge">New</span>
                      </a>
                    </li>
                    <li><a>Settings</a></li>
                    <li><a>Logout</a></li>
                  </ul>
                </div>  
              )}
            </div>
          </div>
        </div>
        <div className="block">
          <div className="overflow-x-hidden max-w-7xl mx-auto min-h-screen px-4">
            {children}
          </div>
        </div>
      </div> 
      <div className="drawer-side">
        <label htmlFor="side-navigation-drawer" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-80 min-h-full bg-base-200">
          {navbarItems.map(item => (
            <Link key={item.href} className="btn btn-ghost" href={item.href}>
              {item.name}
            </Link>
          ))}
          <ThemeSwitch />
        </ul>
      </div>
    </div>
  )
};

export default Layout;