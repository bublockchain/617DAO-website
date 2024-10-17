import React from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import s from "./navbar.module.scss";
import Image from "next/image";
import Link from "next/link";
import { Oxygen_Mono } from "next/font/google";
import { useUser } from "../../components/ui/UserProvider";
import { useRouter } from 'next/router';
import { useMediaQuery } from 'react-responsive';

const oxygen_mono = Oxygen_Mono({
    subsets: ['latin'],
    weight: '400'
})

export default function Navbar() { 
    const { isPresident, isMember, address } = useUser();
    const router = useRouter();
    const isMobile = useMediaQuery({ maxWidth: 767 });

    return (
        <nav className={`${s.navbar} ${oxygen_mono.className}`}>
            <div className={s.regular}>
                <Link className={s.logo} href={'/'}>
                    <Image src="/bublogo.png" alt="BU Blockchain" width={48} height={48} />
                </Link>   
                <Link className={s.bu} href={'/'}>
                    617DAO
                </Link>
        
                <div className={s.space}>

                </div>
                <div className={s.links}>
                    {isPresident && router.pathname !== '/president' && (
                        <Link href="/president">
                            <div className={s.link}>
                                President
                            </div>
                        </Link>
                    )}
                    {isMember && address && (
                        <Link href="/profile">
                            <div className={s.link}>
                                Profile
                            </div>
                        </Link>
                    )}
                    {!isMobile && (
                        <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false}/>
                    )}
                </div>
            </div>
        </nav>
    )
}
