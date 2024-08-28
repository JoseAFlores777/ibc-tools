'use client';

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button, ScrollArea, Separator } from '@/lib/shadcn/ui';
import { Nav } from "@/lib/shadcn/components";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
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
} from "lucide-react"



export interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // useEffect(() => {
  //   if (isOpen) {
  //     // Deshabilitar scroll en el body cuando el menú está abierto
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     // Habilitar scroll en el body cuando el menú está cerrado
  //     document.body.style.overflow = '';
  //   }

  //   // Limpiar efecto al desmontar
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, [isOpen]);

  return (
    <div className="sticky top-0 z-50">
      {isOpen ? (
        <div className="h-auto max-h-screen bg-white/10 backdrop-blur-lg transition duration-500 ease-in-out transform">
          <div className="top-0 z-50">
            <NavbarHeader onClick={toggleMenu} />
          </div>
          <Separator orientation="horizontal" />
          <ScrollArea className="h-screen">
            <Nav
            isCollapsed={false}
            links={[
              {
                title: "Inbox",
                label: "128",
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
              {
                title: "Drafts",
                label: "9",
                icon: File,
                variant: "ghost",
              },
              {
                title: "Sent",
                label: "",
                icon: Send,
                variant: "ghost",
              },
              {
                title: "Junk",
                label: "23",
                icon: ArchiveX,
                variant: "ghost",
              },
              {
                title: "Trash",
                label: "",
                icon: Trash2,
                variant: "ghost",
              },
              {
                title: "Archive",
                label: "",
                icon: Archive,
                variant: "ghost",
              },
            ]}
          />
            </ScrollArea>
            </div>

            
            
        
      ) : (
        <NavbarHeader onClick={toggleMenu} />
      )}
    </div>
  );
};

interface NavbarHeaderProps {
  onClick: () => void;
}

const NavbarHeader: React.FC<NavbarHeaderProps> = ({ onClick }) => {
  return (
    <div className="w-full h-auto p-5 bg-transparent flex justify-between items-center transition duration-500 ease-in-out transform">
      <Image src="/images/IBC_Logo-min.png" alt="logo" width={50} height={50} />
      <span className="text-lg text-primary font-light">El Calvario</span>
      <Button onClick={onClick} variant="link" size="icon" className="bg-transparent">
        <HamburgerMenuIcon className="h-7 w-7 text-primary" />
      </Button>
    </div>
  );
};
