import React from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import s from "./navbar.module.scss";
import Image from "next/image";
import Link from "next/link";
import { Oxygen_Mono } from "next/font/google";
import { useUser } from "../../components/ui/UserProvider";
import { contractAddresses } from '../../src/contractConfig';

const oxygen_mono = Oxygen_Mono({
    subsets: ['latin'],
    weight: '400'
})

interface Props {
    setopened: (opened: boolean) => void
}

export default function Navbar({ setopened }: Props) { 
    const { isPresident, address } = useUser();

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
                    {isPresident && (
                        <Link href="/president">
                            <div className={s.link}>
                                President
                            </div>
                        </Link>
                    )}
                    <ConnectButton accountStatus="address" chainStatus="none" showBalance={false}/>
                </div>
            </div>
        </nav>
    )
}