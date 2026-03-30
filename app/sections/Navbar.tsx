'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, FC } from 'react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/herramientas', label: 'Herramientas' },
  { href: '/horarios', label: 'Horarios' },
];

export interface NavbarProps {}
const Navbar: FC<NavbarProps> = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <div
        className={clsx(
          'top-0 z-50 fixed w-[100vw] transition-all duration-500',
          isOpen ? 'bg-white/10 backdrop-blur-lg' : 'bg-transparent',
        )}
      >
        {/* Header bar */}
        <div className="w-full px-5 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/IBC_Logo-min.png" alt="logo" width={50} height={50} />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-sm transition-colors hover:text-slate-900',
                  isActive(link.href)
                    ? 'font-bold text-slate-900'
                    : 'text-slate-600',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger button (mobile) */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900"
            aria-label={isOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="navbarMenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden bg-white/10 backdrop-blur-lg md:hidden"
            >
              <nav className="flex flex-col px-5 py-4 gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'text-base py-2 transition-colors hover:text-slate-900',
                      isActive(link.href)
                        ? 'font-bold text-slate-900'
                        : 'text-slate-600',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Navbar;
