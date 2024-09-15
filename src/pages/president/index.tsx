import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from './President.module.scss';
import { useReadContract } from 'wagmi';
import { abi as daoABI } from '../../../../out/DAO.sol/DAO.json';
import { contractAddresses } from '../../contractConfig';

interface Member {
  memberAddress: string;
  name: string;
}

const President: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);

  const { data: membersList } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'membersList',
  });

  useEffect(() => {
    if (membersList) {
      setMembers(membersList as Member[]);
      console.log(membersList);
    }
  }, [membersList]);

  return (
    <div className={styles.container}>
      <Head>
        <title>President Dashboard</title>
        <meta name="description" content="President Dashboard for 617DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.leftSide}>
          <h1>Member Management</h1>
          <div className={styles.dashboard}>
            <div className={styles.sectionTitle}>
              <h2>President</h2>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.button}>Add</button>
              <button className={styles.removeButton}>Remove</button>
            </div>

            <div className={styles.sectionTitle}>
              <h2>VP</h2>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.button}>Add</button>
              <button className={styles.removeButton}>Remove</button>
            </div>

            <div className={styles.sectionTitle}>
              <h2>Board</h2>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.button}>Add</button>
              <button className={styles.removeButton}>Remove</button>
            </div>

            <div className={styles.sectionTitle}>
              <h2>Members</h2>
              <button className={styles.button}>Add</button>
            </div>
            <div className={styles.membersList}>
              {members.map((member, index) => (
                <div key={index} className={styles.member}>
                  {member.name} 
                  {`${member.memberAddress.slice(0, 3)}...${member.memberAddress.slice(-4)}`}
                  <button className={styles.removeButton}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default President;
