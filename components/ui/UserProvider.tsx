import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { abi as daoABI } from '../../../out/DAO.sol/DAO.json';

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

  const { data: presidentStatus } = useContractRead({
    address: '0xxxxxxxx', // Replace with your DAO contract address
    abi: daoABI,
    functionName: 'isPresident',
    args: [address],
  });

  const { data: memberStatus } = useContractRead({
    address: '0x582a7Bf7B31D90fA4D2231C1414A59389Eea7ef3', // Replace with your DAO contract address once off testnet
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
