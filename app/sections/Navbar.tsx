'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';

export interface NavbarProps {}
const Navbar: FC<NavbarProps> = () => {
  return (
    <div className="top-0 z-50 fixed w-[100vw] bg-transparent">
      <div className="w-full px-5 py-3 flex justify-center items-center">
        <Link href="/">
          <Image src="/images/IBC_Logo-min.png" alt="logo" width={50} height={50} />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
