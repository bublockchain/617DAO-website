import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { abi as daoABI } from '../../abis/DAO.json';
import { contractAddresses } from '../../src/contractConfig';

interface UserContextType {
  isPresident: boolean;
  isMember: boolean;
  address: string | undefined;
}

const UserContext = createContext<UserContextType>({ isPresident: false, isMember: false, address: undefined });

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPresident, setIsPresident] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const { address } = useAccount();

  const { data: presidentStatus } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`, // Replace with your DAO contract address
    abi: daoABI,
    functionName: 'isPresident',
    args: [address],
  });

  const { data: memberStatus } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`, // Replace with your DAO contract address once off testnet
    abi: daoABI,
    functionName: 'isMember',
    args: [address],
  });

  useEffect(() => {
    setIsPresident(presidentStatus as boolean);
  }, [presidentStatus]);

  useEffect(() => {
    setIsMember(memberStatus as boolean);
  }, [memberStatus]);

  return (
    <UserContext.Provider value={{ isPresident, isMember, address }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
