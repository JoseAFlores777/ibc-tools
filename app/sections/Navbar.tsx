'use client';

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, ScrollArea, Separator } from '@/lib/shadcn/ui';
import { Nav } from "@/lib/shadcn/components";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState, useEffect, FC } from "react";
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react";

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

  return (
    <>
      <div
        className={clsx(
          'top-0 z-50 h-auto fixed w-[100vw] transition-all duration-500 bg-white/10 backdrop-blur-lg',
          isOpen ? ' bg-white/10 backdrop-blur-lg' : 'bg-transparent'
        )}
      >
        <NavbarHeader isOpen={isOpen} onClick={toggleMenu} />
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="navbarMenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ display: 'none', height: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <NavbarMenu />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
interface NavbarHeaderProps {
  isOpen: boolean;
  onClick: () => void;
}

const NavbarHeader: FC<NavbarHeaderProps> = ({ isOpen, onClick }) => (
  <div className="w-full h-auto p-5 bg-transparent flex justify-center items-center transition duration-500 ease-in-out transform">
    <Image src="/images/IBC_Logo-min.png" alt="logo" width={80} height={80} />
    {/* <span className="text-lg text-primary font-normal">El Calvario</span> */}
    {/* <Button onClick={onClick} variant="link" size="icon" className="bg-transparent">
      {isOpen ? <Cross1Icon className="h-7 w-7 text-primary" /> : <HamburgerMenuIcon className="h-7 w-7 text-primary" />}
    </Button> */}
  </div>
);

const NavbarMenu: FC = () => (
  <div className="h-auto max-h-full overflow-hidden bg-white/10 backdrop-blur-lg transition duration-500 ease-in-out transform">
    <Separator orientation="horizontal" />
    <ScrollArea className="h-svh px-5 pt-5 pb-32">

      <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
        <Nav
        className="flex flex-col gap-4"
        isCollapsed={false}
        links={getNavLinks()}
      />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </ScrollArea>
  </div>
);

const getNavLinks = () => [
  { title: "Inbox", label: "128", icon: Inbox, variant: "default" as const },
  { title: "Drafts", label: "9", icon: File, variant: "ghost" as const },
  { title: "Sent", label: "", icon: Send, variant: "ghost" as const },
  { title: "Junk", label: "23", icon: ArchiveX, variant: "ghost" as const },
  { title: "Trash", label: "", icon: Trash2, variant: "ghost" as const },
  { title: "Archive", label: "", icon: Archive, variant: "ghost" as const },
  { title: "Inbox", label: "128", icon: Inbox, variant: "ghost" as const },
  // Puedes agregar más links aquí si es necesario
];

export default Navbar;
