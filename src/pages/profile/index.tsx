import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import styles from './Profile.module.scss';
import { abi as daoABI } from '@/abis/DAO.json';
import { abi as faucetABI } from '@/abis/Faucet.json';
import { contractAddresses } from '@/src/contractConfig';
import { useUser } from "@/components/ui/UserProvider";
import Head from 'next/head';

const Profile = () => {
  const { address, isConnected } = useAccount();
  const [meetingsAttended, setMeetingsAttended] = useState<number | null>(null);
  const [isRequestPending, setIsRequestPending] = useState(false);

  const { isMember } = useUser();

  const { data: meetingsCount } = useReadContract({
    address: contractAddresses.DAO as `0x${string}`,
    abi: daoABI,
    functionName: 'getNumberOfMeetingsAttended',
    args: [address],
  });

  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (meetingsCount) {
      setMeetingsAttended(Number(meetingsCount));
    }
  }, [meetingsCount]);

  const handleRequestFunds = async () => {
    setIsRequestPending(true);
    try {
      await writeContract({
        address: contractAddresses.Faucet as `0x${string}`,
        abi: faucetABI,
        functionName: 'makeFundingRequest',
      });
    } catch (error) {
      console.error("Error requesting funds:", error);
    } finally {
      setIsRequestPending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>
          Please connect your wallet
        </h4>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>User Profile</title>
        <meta
          content="BU Blockchain's DAO"
          name="617DAO"
        />
        <link rel="shortcut icon" href="/bub.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.leftSide}>
          <h1>Profile</h1>
          <div className={styles.profileInfo}>
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Meetings Attended:</strong> {meetingsAttended !== null ? meetingsAttended : 'Loading...'}
            </p>
          </div>
        </div>

        <div className={styles.rightSide}>
          <h1>Actions</h1>
          <button
            onClick={handleRequestFunds}
            disabled={isRequestPending || !isMember}
            className={styles.fundButton}
          >
            {isRequestPending ? 'Requesting...' : 'Request Funds'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
